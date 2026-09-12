import { Request, Response } from 'express';
import { 
  createWorksheet, 
  listWorksheets, 
  getWorksheetDetails,
  deleteWorksheet
} from '../services/worksheets.service';

export const generateWorksheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subject, topic, difficulty } = req.body;
    if (!title || !subject || !topic || !difficulty) {
      res.status(400).json({ success: false, error: 'All fields are required' });
      return;
    }
    const userId = req.user?.id || 'demo-faculty-id';

    const sheet = await createWorksheet({
      title,
      subject,
      topic,
      difficulty,
      userId,
    });

    res.status(201).json({ success: true, data: sheet });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate worksheet' });
  }
};

export const getSheets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'demo-faculty-id';
    const sheets = await listWorksheets(userId);
    res.json({ success: true, data: sheets });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch worksheets' });
  }
};

export const getSheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sheet = await getWorksheetDetails(id);
    if (!sheet) {
      res.status(404).json({ success: false, error: 'Worksheet not found' });
      return;
    }
    res.json({ success: true, data: sheet });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch worksheet' });
  }
};

export const removeSheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteWorksheet(id);
    res.json({ success: true, message: 'Worksheet deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete worksheet' });
  }
};
