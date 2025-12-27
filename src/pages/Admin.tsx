import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Globe, Users, GraduationCap, Plus, Trash2, 
  Loader2, Building, BookOpen 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface University {
  id: string;
  name: string;
}

interface UniversityDomain {
  id: string;
  domain: string;
  university_id: string;
  university?: University;
}

interface Cohort {
  id: string;
  degree_name: string;
  university_id: string | null;
}

interface UserWithOnboarding {
  id: string;
  email: string | null;
  full_name: string | null;
  cohort_id: string | null;
  cohort_name?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Domain management state
  const [domains, setDomains] = useState<UniversityDomain[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newDomainUniversity, setNewDomainUniversity] = useState("");
  const [loadingDomains, setLoadingDomains] = useState(true);
  
  // User management state
  const [users, setUsers] = useState<UserWithOnboarding[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Cohort management state
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [newCohortName, setNewCohortName] = useState("");
  const [loadingCohorts, setLoadingCohorts] = useState(true);

  useEffect(() => {
    fetchUniversities();
    fetchDomains();
    fetchUsers();
    fetchCohorts();
  }, []);

  const fetchUniversities = async () => {
    const { data } = await supabase.from("universities").select("*").order("name");
    if (data) setUniversities(data);
  };

  const fetchDomains = async () => {
    setLoadingDomains(true);
    const { data } = await supabase
      .from("university_domains")
      .select("*, universities(name)")
      .order("domain");
    if (data) {
      setDomains(data.map(d => ({
        ...d,
        university: d.universities as unknown as University
      })));
    }
    setLoadingDomains(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .order("email");
    
    if (profiles) {
      const { data: onboardings } = await supabase
        .from("user_onboarding")
        .select("user_id, cohort_id");
      
      const { data: cohortsData } = await supabase
        .from("cohorts")
        .select("id, degree_name");
      
      const cohortMap = new Map(cohortsData?.map(c => [c.id, c.degree_name]) || []);
      const onboardingMap = new Map(onboardings?.map(o => [o.user_id, o.cohort_id]) || []);
      
      setUsers(profiles.map(p => ({
        ...p,
        cohort_id: onboardingMap.get(p.id) || null,
        cohort_name: onboardingMap.get(p.id) ? cohortMap.get(onboardingMap.get(p.id)!) : undefined
      })));
    }
    setLoadingUsers(false);
  };

  const fetchCohorts = async () => {
    setLoadingCohorts(true);
    const { data } = await supabase.from("cohorts").select("*").order("degree_name");
    if (data) setCohorts(data);
    setLoadingCohorts(false);
  };

  const handleAddDomain = async () => {
    if (!newDomain || !newDomainUniversity) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase.from("university_domains").insert({
      domain: newDomain.toLowerCase().trim(),
      university_id: newDomainUniversity
    });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Domain added", description: `${newDomain} mapped successfully` });
      setNewDomain("");
      setNewDomainUniversity("");
      fetchDomains();
    }
  };

  const handleDeleteDomain = async (id: string) => {
    const { error } = await supabase.from("university_domains").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Domain removed" });
      fetchDomains();
    }
  };

  const handleUpdateUserCohort = async (userId: string, cohortId: string | null) => {
    const { error } = await supabase
      .from("user_onboarding")
      .update({ cohort_id: cohortId })
      .eq("user_id", userId);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User cohort updated" });
      fetchUsers();
    }
  };

  const handleAddCohort = async () => {
    if (!newCohortName || !selectedUniversity) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase.from("cohorts").insert({
      degree_name: newCohortName.trim(),
      university_id: selectedUniversity
    });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cohort created", description: `${newCohortName} added successfully` });
      setNewCohortName("");
      fetchCohorts();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">Manage domains, users, and cohorts</p>
          </div>
        </div>

        <Tabs defaultValue="domains" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="domains" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Cohorts
            </TabsTrigger>
          </TabsList>

          {/* Domain Management */}
          <TabsContent value="domains">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Email Domain Mappings
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Map email domains to universities for automatic detection during signup.
              </p>
              
              <div className="flex gap-3 mb-6">
                <Input
                  placeholder="e.g., student.ie.edu"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1"
                />
                <Select value={newDomainUniversity} onValueChange={setNewDomainUniversity}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="University" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map(uni => (
                      <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddDomain}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {loadingDomains ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map(domain => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-mono">{domain.domain}</TableCell>
                        <TableCell>{domain.university?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteDomain(domain.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {domains.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No domain mappings yet. Add one above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Cohort Assignments
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Override user cohort assignments manually.
              </p>

              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Cohort</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell>{user.full_name || "—"}</TableCell>
                        <TableCell>
                          <Select 
                            value={user.cohort_id || "none"} 
                            onValueChange={(val) => handleUpdateUserCohort(user.id, val === "none" ? null : val)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="No cohort" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No cohort</SelectItem>
                              {cohorts.map(cohort => (
                                <SelectItem key={cohort.id} value={cohort.id}>
                                  {cohort.degree_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          {/* Cohort Management */}
          <TabsContent value="cohorts">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Cohort Management
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Create new cohorts under universities.
              </p>
              
              <div className="flex gap-3 mb-6">
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="University" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map(uni => (
                      <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Cohort name (e.g., MBA 2025)"
                  value={newCohortName}
                  onChange={(e) => setNewCohortName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddCohort}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>

              {loadingCohorts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cohort Name</TableHead>
                      <TableHead>University</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cohorts.map(cohort => {
                      const uni = universities.find(u => u.id === cohort.university_id);
                      return (
                        <TableRow key={cohort.id}>
                          <TableCell className="font-medium">{cohort.degree_name}</TableCell>
                          <TableCell>{uni?.name || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
