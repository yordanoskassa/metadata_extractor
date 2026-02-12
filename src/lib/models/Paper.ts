import mongoose, { Schema, Document } from "mongoose";

export interface IPaper extends Document {
  doi: string;
  title: string;
  author: string;
  publicationTitle: string;
  publicationDate: string;
  url: string;
  keywords: string;
  abstract: string;
  publisher: string;
  fieldOfStudy: string;
  isDataFusionPaper: boolean;
  dataFusionClassificationReason: string;
  createdAt: Date;
}

const PaperSchema = new Schema<IPaper>(
  {
    doi: { type: String, default: "" },
    title: { type: String, default: "" },
    author: { type: String, default: "" },
    publicationTitle: { type: String, default: "" },
    publicationDate: { type: String, default: "" },
    url: { type: String, default: "" },
    keywords: { type: String, default: "" },
    abstract: { type: String, default: "" },
    publisher: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    isDataFusionPaper: { type: Boolean, default: false },
    dataFusionClassificationReason: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Paper =
  mongoose.models.Paper || mongoose.model<IPaper>("Paper", PaperSchema);
