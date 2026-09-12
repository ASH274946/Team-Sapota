import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';

// Fetch global system settings
export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: { id: 'global' },
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error(`[Settings - getSettings] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch settings.' });
  }
};

// Update global system settings
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      platformName,
      brandColor,
      logoUrl,
      maintenanceMode,
      defaultTimezone,
      dataRetentionDays,
      enableAiAnalytics,
      notifyApiSpikes,
      forceMfa,
    } = req.body;

    const data: any = {};
    if (platformName !== undefined) data.platformName = platformName;
    if (brandColor !== undefined) data.brandColor = brandColor;
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (maintenanceMode !== undefined) data.maintenanceMode = maintenanceMode;
    if (defaultTimezone !== undefined) data.defaultTimezone = defaultTimezone;
    if (dataRetentionDays !== undefined) data.dataRetentionDays = dataRetentionDays;
    if (enableAiAnalytics !== undefined) data.enableAiAnalytics = enableAiAnalytics;
    if (notifyApiSpikes !== undefined) data.notifyApiSpikes = notifyApiSpikes;
    if (forceMfa !== undefined) data.forceMfa = forceMfa;

    const updatedSettings = await prisma.systemSetting.upsert({
      where: { id: 'global' },
      update: data,
      create: { id: 'global', ...data },
    });

    res.json({ success: true, data: updatedSettings });
  } catch (error) {
    logger.error(`[Settings - updateSettings] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update settings.' });
  }
};

// Fetch API integrations status
export const getIntegrations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const integrations: any[] = [
      {
        id: 'canvas',
        name: 'Canvas LMS Connector',
        status: 'active', // Mocked as active for now as per original UI
        description: 'Active - 12/12 Institutions live',
      },
      {
        id: 'google_workspace',
        name: 'Google Workspace Auth',
        status: 'setup_required', // Mocked as setup required
        description: 'Setup Required - Click to config',
      }
    ];

    if (process.env.OPENAI_API_KEY) {
      integrations.unshift({
        id: 'openai',
        name: 'OpenAI',
        status: 'active',
        description: `Connected - sk-...${process.env.OPENAI_API_KEY.slice(-4)}`
      });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      integrations.unshift({
        id: 'anthropic',
        name: 'Anthropic Claude',
        status: 'active',
        description: `Connected - sk-ant-...${process.env.ANTHROPIC_API_KEY.slice(-4)}`
      });
    }
    if (process.env.GEMINI_API_KEY) {
      integrations.unshift({
        id: 'google',
        name: 'Google Gemini',
        status: 'active',
        description: `Connected - AIzaSy...${process.env.GEMINI_API_KEY.slice(-4)}`
      });
    }
    if (process.env.NVIDIA_API_KEY) {
      integrations.unshift({
        id: 'nvidia',
        name: 'NVIDIA',
        status: 'active',
        description: `Connected - nvapi-...${process.env.NVIDIA_API_KEY.slice(-4)}`
      });
    }
    if (process.env.GROQ_API_KEY) {
      integrations.unshift({
        id: 'groq',
        name: 'Groq',
        status: 'active',
        description: `Connected - gsk-...${process.env.GROQ_API_KEY.slice(-4)}`
      });
    }

    res.json({ success: true, data: integrations });
  } catch (error) {
    logger.error(`[Settings - getIntegrations] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch integrations.' });
  }
};
