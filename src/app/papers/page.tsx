"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Download, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaperData {
  _id: string;
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
  createdAt: string;
}

export default function PapersPage() {
  const [papers, setPapers] = useState<PaperData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPapers = async () => {
    try {
      const res = await fetch("/api/papers");
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err) {
      console.error("Failed to fetch papers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/papers/${id}`, { method: "DELETE" });
      setPapers((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(null);
    }
  };

  const exportCSV = () => {
    const headers = [
      "DOI",
      "Title",
      "Author",
      "Publication Title",
      "PublicationDate",
      "URL",
      "Keywords",
      "Abstract",
      "Publisher",
      "Field of Study",
      "IsDataFusionPaper",
      "DataFusionClassificationReason",
    ];

    const escape = (val: string) => {
      const s = String(val || "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = papers.map((p) =>
      [
        p.doi,
        p.title,
        p.author,
        p.publicationTitle,
        p.publicationDate,
        p.url,
        p.keywords,
        p.abstract,
        p.publisher,
        p.fieldOfStudy,
        p.isDataFusionPaper ? "TRUE" : "FALSE",
        p.dataFusionClassificationReason,
      ]
        .map(escape)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "papers_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Saved Papers</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} disabled={papers.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Upload New
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {papers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">
                No papers extracted yet
              </p>
              <Link href="/" className="mt-4">
                <Button>Upload a PDF</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {papers.length} Paper{papers.length !== 1 ? "s" : ""} Extracted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>DOI</TableHead>
                      <TableHead>Publication</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Data Fusion</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {papers.map((paper) => (
                      <TableRow key={paper._id}>
                        <TableCell className="max-w-[250px] truncate font-medium">
                          {paper.title || "—"}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {paper.author || "—"}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate text-xs">
                          {paper.doi || "—"}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {paper.publicationTitle || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {paper.publicationDate || "—"}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {paper.fieldOfStudy || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={paper.isDataFusionPaper ? "default" : "secondary"}
                          >
                            {paper.isDataFusionPaper ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(paper._id)}
                            disabled={deleting === paper._id}
                          >
                            {deleting === paper._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
