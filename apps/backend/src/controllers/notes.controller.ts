import { Request, Response } from 'express';
import { 
  createGeneratedNotes, 
  listUserNotes, 
  getNoteDetails, 
  deleteNote 
} from '../services/notes.service';

export const generateNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subject, topic, type } = req.body;
    if (!title || !subject || !topic || !type) {
      res.status(400).json({ success: false, error: 'All fields are required' });
      return;
    }
    const userId = req.user?.id || 'demo-faculty-id';

    const note = await createGeneratedNotes({
      title,
      subject,
      topic,
      type,
      userId,
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate notes' });
  }
};

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'demo-faculty-id';
    const notes = await listUserNotes(userId);
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notes list' });
  }
};

export const getNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const note = await getNoteDetails(id);
    if (!note) {
      res.status(404).json({ success: false, error: 'Notes not found' });
      return;
    }
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notes details' });
  }
};

export const removeNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteNote(id);
    res.json({ success: true, message: 'Notes deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete notes' });
  }
};
