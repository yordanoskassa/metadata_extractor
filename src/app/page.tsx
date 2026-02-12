"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Upload, FileText, Loader2, AlertCircle, Plus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  createdAt?: string;
}

const emptyForm = {
  doi: "",
  title: "",
  author: "",
  publicationTitle: "",
  publicationDate: "",
  url: "",
  keywords: "",
  abstract: "",
  publisher: "",
  fieldOfStudy: "",
  isDataFusionPaper: false,
  dataFusionClassificationReason: "",
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [recentPapers, setRecentPapers] = useState<PaperData[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("pdf");
  const [selectedPaper, setSelectedPaper] = useState<PaperData | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchRecentPapers();
  }, []);

  const fetchRecentPapers = async () => {
    try {
      const res = await fetch("/api/papers");
      const data = await res.json();
      setRecentPapers(data.papers?.slice(0, 5) || []);
    } catch (err) {
      console.error("Failed to fetch recent papers:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
      setError(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");

      setForm({
        doi: data.extracted.doi || "",
        title: data.extracted.title || "",
        author: data.extracted.author || "",
        publicationTitle: data.extracted.publicationTitle || "",
        publicationDate: data.extracted.publicationDate || "",
        url: data.extracted.url || "",
        keywords: data.extracted.keywords || "",
        abstract: data.extracted.abstract || "",
        publisher: data.extracted.publisher || "",
        fieldOfStudy: data.extracted.fieldOfStudy || "",
        isDataFusionPaper: data.extracted.isDataFusionPaper || false,
        dataFusionClassificationReason: data.extracted.dataFusionClassificationReason || "",
      });
      setActiveTab("manual");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/papers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setForm(emptyForm);
      setFile(null);
      fetchRecentPapers();
      setActiveTab("recent");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const detailFields: { key: keyof PaperData; label: string }[] = [
    { key: "doi", label: "DOI" },
    { key: "title", label: "Title" },
    { key: "author", label: "Authors" },
    { key: "publicationTitle", label: "Publication" },
    { key: "publicationDate", label: "Date" },
    { key: "url", label: "URL" },
    { key: "keywords", label: "Keywords" },
    { key: "abstract", label: "Abstract" },
    { key: "publisher", label: "Publisher" },
    { key: "fieldOfStudy", label: "Field of Study" },
    { key: "dataFusionClassificationReason", label: "Data Fusion Reason" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">Paper Extractor</h1>
          <Link href="/papers">
            <Button variant="ghost" size="sm">All Papers</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pdf">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="mr-2 h-4 w-4" />
              Entry
            </TabsTrigger>
            <TabsTrigger value="recent">
              <History className="mr-2 h-4 w-4" />
              Recent
            </TabsTrigger>
          </TabsList>

          {/* PDF Upload Tab */}
          <TabsContent value="pdf">
            <Card>
              <CardContent className="pt-6">
                <div
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                    dragOver ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="mb-1 font-medium">{file ? file.name : "Drop PDF here"}</p>
                  <p className="mb-4 text-sm text-muted-foreground">or browse files</p>
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
                  <label htmlFor="pdf-upload">
                    <Button variant="outline" size="sm" asChild><span>Choose File</span></Button>
                  </label>
                </div>
                {file && (
                  <div className="mt-4 flex justify-center">
                    <Button onClick={handleExtract} disabled={loading}>
                      {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extracting...</>
                      ) : (
                        <><FileText className="mr-2 h-4 w-4" />Extract & Fill Form</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Entry / Edit Tab */}
          <TabsContent value="manual">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs">Title *</Label>
                      <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="doi" className="text-xs">DOI</Label>
                      <Input id="doi" value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} placeholder="10.1234/example" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="author" className="text-xs">Authors</Label>
                      <Input id="author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Semicolon separated" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="publicationTitle" className="text-xs">Publication</Label>
                      <Input id="publicationTitle" value={form.publicationTitle} onChange={(e) => setForm({ ...form, publicationTitle: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="publicationDate" className="text-xs">Date</Label>
                      <Input id="publicationDate" value={form.publicationDate} onChange={(e) => setForm({ ...form, publicationDate: e.target.value })} placeholder="YYYY-MM-DD" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="publisher" className="text-xs">Publisher</Label>
                      <Input id="publisher" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fieldOfStudy" className="text-xs">Field of Study</Label>
                      <Input id="fieldOfStudy" value={form.fieldOfStudy} onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="url" className="text-xs">URL</Label>
                      <Input id="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="keywords" className="text-xs">Keywords</Label>
                    <Input id="keywords" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="Semicolon separated" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="abstract" className="text-xs">Abstract</Label>
                    <Textarea id="abstract" value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="isDataFusion" checked={form.isDataFusionPaper} onCheckedChange={(c) => setForm({ ...form, isDataFusionPaper: c })} />
                    <Label htmlFor="isDataFusion" className="text-xs">Data Fusion Paper</Label>
                  </div>
                  {form.isDataFusionPaper && (
                    <div className="space-y-1.5">
                      <Label htmlFor="dfReason" className="text-xs">Classification Reason</Label>
                      <Textarea id="dfReason" value={form.dataFusionClassificationReason} onChange={(e) => setForm({ ...form, dataFusionClassificationReason: e.target.value })} rows={2} />
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={saving} className="flex-1">
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Paper"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>Clear</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Papers Tab */}
          <TabsContent value="recent">
            <Card>
              <CardContent className="pt-6">
                {recentPapers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No papers yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentPapers.map((paper) => (
                      <button
                        key={paper._id}
                        onClick={() => setSelectedPaper(paper)}
                        className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                      >
                        <p className="font-medium leading-snug">{paper.title || "Untitled"}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{paper.author || "Unknown author"}</p>
                        <div className="mt-2 flex gap-1.5">
                          {paper.fieldOfStudy && <Badge variant="outline" className="text-[10px]">{paper.fieldOfStudy}</Badge>}
                          <Badge variant={paper.isDataFusionPaper ? "default" : "secondary"} className="text-[10px]">
                            {paper.isDataFusionPaper ? "Data Fusion" : "Not DF"}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Paper Detail Modal */}
        <Dialog open={!!selectedPaper} onOpenChange={(open) => { if (!open) setSelectedPaper(null); }}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="leading-snug">{selectedPaper?.title || "Paper Details"}</DialogTitle>
            </DialogHeader>
            {selectedPaper && (
              <div className="space-y-3 pt-2">
                {detailFields.map(({ key, label }) => {
                  const value = String(selectedPaper[key] || "");
                  if (!value) return null;
                  return (
                    <div key={key}>
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      {key === "url" ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline break-all">{value}</a>
                      ) : (
                        <p className="text-sm">{value}</p>
                      )}
                    </div>
                  );
                })}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Data Fusion</p>
                  <Badge variant={selectedPaper.isDataFusionPaper ? "default" : "secondary"}>
                    {selectedPaper.isDataFusionPaper ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
