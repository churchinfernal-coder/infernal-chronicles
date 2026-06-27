import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Save, FileDown, Sparkles, Loader2, Globe, Trash2, Edit, Star, DollarSign, Upload, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Character {
  name: string;
  background: string;
  personality: string;
  role: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
}

interface BookProject {
  id: string;
  title: string;
  genre: string;
  prompt: string;
  characters: Character[];
  setting: string;
  style: string;
  target_length: number;
  status: string;
}

export default function BookWritingEngine() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<BookProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<BookProject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [generating, setGenerating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [publishedBooks, setPublishedBooks] = useState<any[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState<string | null>(null);

  const [newProject, setNewProject] = useState({
    title: "",
    genre: "fiction",
    prompt: "",
    setting: "",
    style: "formal",
    target_length: 50000,
    language: "english"
  });

  const [tableOfContents, setTableOfContents] = useState<Array<{chapterNumber: number, title: string, description: string}>>([]);
  const [generatingTOC, setGeneratingTOC] = useState(false);

  const [newCharacter, setNewCharacter] = useState<Character>({
    name: "",
    background: "",
    personality: "",
    role: ""
  });

  useEffect(() => {
    loadProjects();
    loadPublishedBooks();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadChapters(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('book_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast({
        title: "Error loading projects",
        description: error. message,
        variant: "destructive"
      });
    } else if (data) {
      setProjects(data. map((p: any) => ({ ...p, characters: Array.isArray(p.characters) ? p.characters : [] })));
    }
    setLoading(false);
  };

  const loadChapters = async (projectId:  string) => {
    const { data, error } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('chapter_number');

    if (error) {
      toast({
        title: "Error loading chapters",
        description:  error.message,
        variant: "destructive"
      });
    } else if (data) {
      setChapters(data);
    }
  };

  const loadPublishedBooks = async () => {
    const { data, error } = await supabase
      .from('occult_library_books')
      .select('*, book_projects(title)')
      .order('published_at', { ascending: false });

    if (error) {
      toast({
        title: "Error loading published books",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      setPublishedBooks(data);
    }
  };

  const publishToLibrary = async () => {
    if (!selectedProject || chapters.length === 0) {
      toast({
        title: "Cannot publish",
        description: "Project must have at least one chapter",
        variant: "destructive"
      });
      return;
    }

    setPublishing(true);
    const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
    const excerpt = chapters[0]?.content. substring(0, 500) || "";

    const { data, error } = await (supabase as any)
      .from('occult_library_books')
      .insert({
        book_project_id: selectedProject.id,
        title: selectedProject.title,
        author: 'Infernal Chronicles',
        description: selectedProject.prompt,
        price_cents: 999,
        category: selectedProject.genre,
        total_chapters: chapters.length,
        total_words: totalWords,
        excerpt: excerpt,
        featured: false
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error publishing book",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Book published to Occult Library!" });
      loadPublishedBooks();
    }
    setPublishing(false);
  };

  const updatePublishedBook = async (bookId: string, updates: any) => {
    const { error } = await (supabase as any)
      .from('occult_library_books')
      .update(updates)
      .eq('id', bookId);

    if (error) {
      toast({
        title: "Error updating book",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Book updated successfully" });
      loadPublishedBooks();
    }
  };

  const deletePublishedBook = async (bookId: string) => {
    const { error } = await supabase
      .from('occult_library_books')
      .delete()
      .eq('id', bookId);

    if (error) {
      toast({
        title: "Error deleting book",
        description: error. message,
        variant: "destructive"
      });
    } else {
      toast({ title:  "Book removed from library" });
      loadPublishedBooks();
    }
  };

  const uploadPDF = async (bookId: string, file: File) => {
    setUploadingPDF(bookId);
    try {
      const filePath = `${bookId}/${file.name}`;
      
      const { error:  uploadError } = await supabase.storage
        .from('book-pdfs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await (supabase as any)
        .from('occult_library_books')
        .update({ pdf_url: filePath })
        .eq('id', bookId);

      if (updateError) throw updateError;

      toast({ title: "PDF uploaded successfully" });
      loadPublishedBooks();
    } catch (error:  any) {
      toast({
        title: "Upload failed",
        description: error. message,
        variant: "destructive"
      });
    }
    setUploadingPDF(null);
  };

  const uploadCover = async (bookId:  string, file: File) => {
    setUploadingCover(bookId);
    try {
      const filePath = `${bookId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('book-covers')
        .getPublicUrl(filePath);

      const { error: updateError } = await (supabase as any)
        .from('occult_library_books')
        .update({ cover_image_url: publicUrl })
        .eq('id', bookId);

      if (updateError) throw updateError;

      toast({ title: "Cover uploaded successfully" });
      loadPublishedBooks();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error. message,
        variant: "destructive"
      });
    }
    setUploadingCover(null);
  };

  const handleCoverUpload = async (bookId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${bookId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title:  "Error uploading cover",
        description:  uploadError.message,
        variant: "destructive"
      });
      return null;
    }

    const { data } = supabase.storage. from('book-covers').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePDFUpload = async (bookId:  string, file: File) => {
    const filePath = `${bookId}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      . from('book-pdfs')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title:  "Error uploading PDF",
        description: uploadError.message,
        variant: "destructive"
      });
      return null;
    }

    return filePath;
  };

  const createProject = async () => {
    if (!newProject.title || !newProject.prompt) {
      toast({
        title: "Missing fields",
        description: "Please provide title and prompt",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { data:  { user } } = await supabase.auth.getUser();
    
    const { data, error } = await (supabase as any)
      .from('book_projects')
      .insert({
        ... newProject,
        user_id: user?. id,
        characters: []
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      toast({ title: "Project created successfully" });
      const mappedData:  BookProject = { ...data, characters: Array.isArray(data.characters) ? data.characters : [] };
      setProjects([mappedData, ...projects]);
      setSelectedProject(mappedData);
      setNewProject({
        title:  "",
        genre: "fiction",
        prompt: "",
        setting: "",
        style: "formal",
        target_length: 50000,
        language: "english"
      });
    }
    setLoading(false);
  };

  const addCharacter = async () => {
    if (!selectedProject || !newCharacter.name) return;

    const updatedCharacters = [...(selectedProject.characters || []), newCharacter];
    
    const { error } = await (supabase as any)
      .from('book_projects')
      .update({ characters: updatedCharacters })
      .eq('id', selectedProject.id);

    if (error) {
      toast({
        title: "Error adding character",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setSelectedProject({ ...selectedProject, characters: updatedCharacters });
      setNewCharacter({ name: "", background: "", personality: "", role: "" });
      toast({ title: "Character added successfully" });
    }
  };

  const generateTableOfContents = async () => {
    if (!selectedProject) return;

    setGeneratingTOC(true);
    try {
      const { data, error } = await supabase. functions.invoke('ai-generate-chapter', {
        body: {
          genre: selectedProject.genre,
          prompt: selectedProject.prompt,
          setting: selectedProject.setting,
          generateTOC: true
        }
      });

      if (error) throw error;

      setTableOfContents(data.tableOfContents);
      toast({ title: "Table of contents generated successfully" });
    } catch (error: any) {
      toast({
        title: "Error generating table of contents",
        description: error.message,
        variant: "destructive"
      });
    }
    setGeneratingTOC(false);
  };

  const generateChapter = async (tocItem?:  {chapterNumber: number, title: string, description: string}) => {
    if (!selectedProject) return;

    setGenerating(true);
    const nextChapterNumber = tocItem?. chapterNumber || chapters.length + 1;
    const chapterTitle = tocItem?.title || `Chapter ${nextChapterNumber}`;

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-chapter', {
        body:  {
          genre: selectedProject. genre,
          prompt: selectedProject.prompt,
          characters: selectedProject.characters,
          setting: selectedProject.setting,
          style: selectedProject.style,
          length: Math.floor(selectedProject.target_length / 20),
          chapterNumber: nextChapterNumber,
          chapterTitle: tocItem?.description || chapterTitle,
          previousChapters: chapters.slice(-2),
          language: (selectedProject as any).language || 'english'
        }
      });

      if (error) throw error;

      const { data: savedChapter, error: saveError } = await (supabase as any)
        .from('book_chapters')
        .insert({
          project_id: selectedProject.id,
          chapter_number: nextChapterNumber,
          title: chapterTitle,
          content: data.content,
          word_count: data.wordCount
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setChapters([...chapters, savedChapter]);
      setSelectedChapter(savedChapter);
      toast({ title: `${chapterTitle} generated successfully` });
    } catch (error: any) {
      toast({
        title: "Error generating chapter",
        description: error.message,
        variant: "destructive"
      });
    }
    setGenerating(false);
  };

  const generateAllChapters = async () => {
    if (!selectedProject || tableOfContents.length === 0) return;

    for (const tocItem of tableOfContents) {
      if (chapters.some(ch => ch.chapter_number === tocItem.chapterNumber)) {
        continue;
      }
      await generateChapter(tocItem);
    }
  };

  const getSuggestions = async (type: string) => {
    if (!selectedChapter) return;

    setSuggesting(true);
    try {
      const { data, error } = await supabase. functions.invoke('ai-suggest-edits', {
        body: {
          text: selectedChapter.content,
          type
        }
      });

      if (error) throw error;

      toast({
        title: "Editing Suggestions",
        description: "Check console for detailed suggestions",
      });
      console.log('AI Suggestions:', data. suggestions);
    } catch (error: any) {
      toast({
        title: "Error getting suggestions",
        description: error. message,
        variant: "destructive"
      });
    }
    setSuggesting(false);
  };

  const saveChapter = async () => {
    if (!selectedChapter) return;

    const wordCount = selectedChapter.content. trim().split(/\s+/).length;

    const { error } = await (supabase as any)
      .from('book_chapters')
      .update({
        content: selectedChapter.content,
        word_count: wordCount
      })
      .eq('id', selectedChapter.id);

    if (error) {
      toast({
        title: "Error saving chapter",
        description: error. message,
        variant: "destructive"
      });
    } else {
      toast({ title:  "Chapter saved successfully" });
      loadChapters(selectedProject! .id);
    }
  };

  const exportBook = async () => {
    if (!selectedProject) return;

    const fullText = chapters
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map(ch => `# ${ch.title}\n\n${ch.content}`)
      .join('\n\n---\n\n');

    const blob = new Blob([`# ${selectedProject.title}\n\nBy ${selectedProject.genre} Author\n\n${fullText}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Book exported successfully" });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Book Writing Engine</h1>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="write" disabled={!selectedProject}>Write & Edit</TabsTrigger>
          <TabsTrigger value="characters" disabled={!selectedProject}>Characters</TabsTrigger>
          <TabsTrigger value="publish">📚 Publish to Library</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Start a new book writing project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Book Title</Label>
                  <Input
                    id="title"
                    value={newProject. title}
                    onChange={(e) => setNewProject({ ...newProject, title: e. target.value })}
                    placeholder="Enter book title"
                  />
                </div>
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Select value={newProject.genre} onValueChange={(value) => setNewProject({ ...newProject, genre: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiction">Fiction</SelectItem>
                      <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                      <SelectItem value="mystery">Mystery</SelectItem>
                      <SelectItem value="romance">Romance</SelectItem>
                      <SelectItem value="science-fiction">Science Fiction</SelectItem>
                      <SelectItem value="fantasy">Fantasy</SelectItem>
                      <SelectItem value="thriller">Thriller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="prompt">Story Prompt</Label>
                <Textarea
                  id="prompt"
                  value={newProject. prompt}
                  onChange={(e) => setNewProject({ ...newProject, prompt: e.target. value })}
                  placeholder="Describe your story idea, plot, themes..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="setting">Setting</Label>
                <Input
                  id="setting"
                  value={newProject.setting}
                  onChange={(e) => setNewProject({ ...newProject, setting: e.target.value })}
                  placeholder="Where and when does the story take place?"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="style">Writing Style</Label>
                  <Select value={newProject.style} onValueChange={(value) => setNewProject({ ...newProject, style: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="informal">Informal</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="dramatic">Dramatic</SelectItem>
                      <SelectItem value="poetic">Poetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={newProject.language} onValueChange={(value) => setNewProject({ ...newProject, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target_length">Target Word Count</Label>
                  <Input
                    id="target_length"
                    type="number"
                    value={newProject.target_length}
                    onChange={(e) => setNewProject({ ...newProject, target_length: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Button onClick={createProject} disabled={loading} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {projects.map((project) => (
                    <Card
                      key={project.id}
                      className={`cursor-pointer transition-colors ${
                        selectedProject?.id === project.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription>
                          {project.genre} • {project. target_length. toLocaleString()} words target
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="write" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Book Generation</CardTitle>
              <CardDescription>Generate table of contents and let AI write your book automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={generateTableOfContents}
                  disabled={generatingTOC || ! selectedProject}
                >
                  {generatingTOC ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating TOC...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Table of Contents
                    </>
                  )}
                </Button>
                {tableOfContents.length > 0 && (
                  <Button
                    onClick={generateAllChapters}
                    disabled={generating}
                    variant="secondary"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Chapters...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate All Chapters
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {tableOfContents.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Table of Contents</h3>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {tableOfContents.map((item) => (
                        <div key={item.chapterNumber} className="flex items-start justify-between gap-2 p-2 hover:bg-muted rounded">
                          <div className="flex-1">
                            <p className="font-medium">{item.chapterNumber}. {item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => generateChapter(item)}
                            disabled={generating || chapters.some(ch => ch.chapter_number === item.chapterNumber)}
                          >
                            {chapters.some(ch => ch.chapter_number === item.chapterNumber) ? (
                              "Generated"
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 mr-1" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {chapters.map((chapter) => (
                      <Button
                        key={chapter.id}
                        variant={selectedChapter?.id === chapter.id ?  "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedChapter(chapter)}
                      >
                        {chapter.title}
                        <span className="ml-auto text-xs">{chapter.word_count} words</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedChapter?.title || 'Select a chapter'}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => getSuggestions('general')}
                      disabled={!selectedChapter || suggesting}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Suggestions
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveChapter}
                      disabled={!selectedChapter}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportBook}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export Book
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedChapter ?  (
                  <Textarea
                    value={selectedChapter.content}
                    onChange={(e) => setSelectedChapter({ ...selectedChapter, content: e.target.value })}
                    className="min-h-[600px] font-serif text-base leading-relaxed"
                  />
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                    Select or generate a chapter to begin editing
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="characters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Character</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newCharacter.name}
                    onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                    placeholder="Character name"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input
                    value={newCharacter.role}
                    onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value })}
                    placeholder="Protagonist, Antagonist, etc."
                  />
                </div>
              </div>
              <div>
                <Label>Background</Label>
                <Textarea
                  value={newCharacter.background}
                  onChange={(e) => setNewCharacter({ ...newCharacter, background: e.target.value })}
                  placeholder="Character's history, origin..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Personality</Label>
                <Textarea
                  value={newCharacter.personality}
                  onChange={(e) => setNewCharacter({ ...newCharacter, personality: e.target.value })}
                  placeholder="Traits, motivations, quirks..."
                  rows={3}
                />
              </div>
              <Button onClick={addCharacter} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Character
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Characters</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {selectedProject?.characters?. map((char, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle className="text-lg">{char.name}</CardTitle>
                        <CardDescription>{char.role}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p><strong>Background:</strong> {char.background}</p>
                        <p><strong>Personality: </strong> {char.personality}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publish" className="space-y-4">
          <Card className="bg-crimson/10 border-crimson/30">
            <CardHeader>
              <CardTitle className="text-crimson flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Publish to Occult Library
              </CardTitle>
              <CardDescription>
                Publish your completed books to the Occult Library for subscription-based access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProject && (
                <div className="p-4 bg-background rounded-lg space-y-3">
                  <h3 className="font-semibold">Selected Project:  {selectedProject.title}</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Chapters:</span>
                      <p className="font-medium">{chapters.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Words:</span>
                      <p className="font-medium">{chapters.reduce((sum, ch) => sum + ch.word_count, 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Genre:</span>
                      <p className="font-medium capitalize">{selectedProject.genre}</p>
                    </div>
                  </div>
                  <Button
                    onClick={publishToLibrary}
                    disabled={publishing || chapters.length === 0}
                    className="w-full bg-crimson hover:bg-crimson/80"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing... 
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Publish to Occult Library
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Published Books</CardTitle>
              <CardDescription>Manage books available in the Occult Library</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {publishedBooks.map((book) => (
                    <Card key={book.id} className="border-crimson/20">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {book.title}
                              {book.featured && <Star className="h-4 w-4 fill-crimson text-crimson" />}
                            </CardTitle>
                            <CardDescription>
                              {book.category} • {book.total_chapters} chapters • {book.total_words. toLocaleString()} words
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={book.title}
                            onChange={(e) => {
                              const updated = publishedBooks.map(b => 
                                b.id === book.id ? { ...b, title: e.target.value } :  b
                              );
                              setPublishedBooks(updated);
                            }}
                            onBlur={() => updatePublishedBook(book.id, { title: book.title })}
                          />
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={book. description || ''}
                            onChange={(e) => {
                              const updated = publishedBooks.map(b => 
                                b.id === book.id ? { ...b, description: e.target.value } : b
                              );
                              setPublishedBooks(updated);
                            }}
                            onBlur={() => updatePublishedBook(book.id, { description: book.description })}
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Author</Label>
                            <Input
                              value={book.author}
                              onChange={(e) => {
                                const updated = publishedBooks.map(b => 
                                  b.id === book.id ? { ...b, author: e.target.value } : b
                                );
                                setPublishedBooks(updated);
                              }}
                              onBlur={() => updatePublishedBook(book.id, { author: book.author })}
                            />
                          </div>
                          <div>
                            <Label className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Price (USD)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(book.price_cents / 100).toFixed(2)}
                              onChange={(e) => {
                                const cents = Math.round(parseFloat(e. target.value) * 100);
                                const updated = publishedBooks.map(b => 
                                  b.id === book.id ? { ...b, price_cents: cents } : b
                                );
                                setPublishedBooks(updated);
                              }}
                              onBlur={() => updatePublishedBook(book.id, { price_cents: book.price_cents })}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Cover Image</Label>
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = await handleCoverUpload(book.id, file);
                                  if (url) {
                                    updatePublishedBook(book.id, { cover_image_url: url });
                                  }
                                }
                              }}
                            />
                            {book.cover_image_url && (
                              <img src={book.cover_image_url} alt="Cover" className="h-20 w-14 object-cover rounded" />
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>PDF File</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="file"
                              accept="application/pdf"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const path = await handlePDFUpload(book.id, file);
                                  if (path) {
                                    updatePublishedBook(book.id, { pdf_url: path });
                                  }
                                }
                              }}
                            />
                            {book.pdf_url && (
                              <Badge variant="outline" className="text-xs">
                                PDF Uploaded
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Amazon Buy Link (Optional)</Label>
                          <Input
                            value={book.amazon_url || ''}
                            onChange={(e) => {
                              const updated = publishedBooks.map(b => 
                                b. id === book.id ? { ... b, amazon_url: e. target.value } : b
                              );
                              setPublishedBooks(updated);
                            }}
                            onBlur={() => updatePublishedBook(book.id, { amazon_url: book.amazon_url })}
                            placeholder="https://amazon.com/..."
                          />
                        </div>

                        <div>
                          <Label>Cover Image URL</Label>
                          <Input
                            value={book.cover_image_url || ''}
                            onChange={(e) => {
                              const updated = publishedBooks.map(b => 
                                b.id === book.id ? { ...b, cover_image_url: e.target.value } : b
                              );
                              setPublishedBooks(updated);
                            }}
                            onBlur={() => updatePublishedBook(book.id, { cover_image_url: book.cover_image_url })}
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <Label>Tags (comma separated)</Label>
                          <Input
                            value={book.tags?. join(', ') || ''}
                            onChange={(e) => {
                              const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                              const updated = publishedBooks.map(b => 
                                b.id === book.id ? { ...b, tags } : b
                              );
                              setPublishedBooks(updated);
                            }}
                            onBlur={() => updatePublishedBook(book.id, { tags: book.tags })}
                            placeholder="occult, ritual, grimoire"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant={book.featured ? "default" : "outline"}
                            size="sm"
                            onClick={() => updatePublishedBook(book.id, { featured: !book.featured })}
                            className={book.featured ? "bg-crimson hover:bg-crimson/80" : ""}
                          >
                            <Star className={`w-4 h-4 mr-1 ${book.featured ?  'fill-current' : ''}`} />
                            {book.featured ? 'Featured' : 'Feature'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remove "${book.title}" from library?`)) {
                                deletePublishedBook(book.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {publishedBooks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No books published yet</p>
                      <p className="text-sm">Select a project and publish it to get started</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}