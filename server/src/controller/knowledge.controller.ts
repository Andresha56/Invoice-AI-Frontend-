import type { Request, Response } from "express";
import {
  DEFAULT_BUSINESS_PROFILE,
  MOCK_CATALOG,
  MOCK_CLIENTS,
} from "../data/knowledgeBase.js";

export const getKnowledgeController = (
  _req: Request,
  res: Response,
): void => {
  res.status(200).json({
    success: true,
    data: {
      clients: MOCK_CLIENTS,
      catalog: MOCK_CATALOG,
      businessProfile: DEFAULT_BUSINESS_PROFILE,
    },
  });
};




// Knowledge Base Directory (for RAG inspection & catalog display)