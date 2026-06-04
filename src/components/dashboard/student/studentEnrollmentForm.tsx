"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Save,
  Loader2,
  X,
  GraduationCap,
  CalendarDays,
  Hash,
  Layers,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, Switch } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";

import { StudentServices } from "@/services/studentServices";
import { EnrollmentServices } from "@/services/studentEnrollment";

import useAuth from "@/lib/hooks/useAuth";
import { SessionServices } from "@/services/sessionsServices";
import { ClassServices } from "@/services/classServices";
import { SectionServices } from "@/services/sectionServices";

interface EnrollmentFormValues {
  student: string | number | null;
  school: string | number | null;
  session: string | number | null;
  class_assigned: string | number | null;
  section: string | number | null;
  is_active: boolean;
  roll_number: number | null; // Roll number state thapiyo
}

export default function StudentEnrollmentForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  
  // Naya roll number state
  const [calculatedRoll, setCalculatedRoll] = useState<number | null>(null);

  const form = useForm<EnrollmentFormValues>({
    defaultValues: {
      student: null,
      school: null,
      session: null,
      class_assigned: null,
      section: null,
      is_active: true,
      roll_number: null,
    },
  });

  const selectedClass = form.watch("class_assigned");
  const selectedSection = form.watch("section");
  const selectedSession = form.watch("session");

  // Logic: Backend jastai same class/section/session vitra ko last roll number khojne
  useEffect(() => {
    const calculateNextRoll = async () => {
      // Create huda matra logic chalaune, update ma roll number change hudaina
      if (!isUpdate && selectedClass && selectedSection && selectedSession) {
        try {
          const allEnrollments = await EnrollmentServices.getAllEnrollments();
          const data = Array.isArray(allEnrollments) ? allEnrollments : allEnrollments?.results || [];

          // Backend style filter logic
          const sectionStudents = data.filter((item: any) => 
            String(item.class_assigned?.id || item.class_assigned) === String(selectedClass) &&
            String(item.section?.id || item.section) === String(selectedSection) &&
            String(item.session?.id || item.session) === String(selectedSession)
          );

          if (sectionStudents.length > 0) {
            // Roll number mathi based sort garera maximum nikalne
            const maxRoll = Math.max(...sectionStudents.map((s: any) => Number(s.roll_number || 0)));
            setCalculatedRoll(maxRoll + 1);
            form.setValue("roll_number", maxRoll + 1);
          } else {
            setCalculatedRoll(1);
            form.setValue("roll_number", 1);
          }
        } catch (error) {
          console.error("Roll calculation failed", error);
        }
      }
    };

    calculateNextRoll();
  }, [selectedClass, selectedSection, selectedSession, isUpdate, form]);
  useEffect(() => {
      const fetchData = async () => {
        try {
          const [studentRes, sessionRes, classRes, sectionsRes] = await Promise.all([
            StudentServices.getAllStudents(),
            SessionServices.getSessions(),
            ClassServices.getAllClasses(),
            SectionServices.getAllSections(),
          ]);

          const studentsData = studentRes.results || studentRes;
          const sessionsData = sessionRes.results || sessionRes;
          const classesData = classRes.results || classRes;
          const sectionsData = sectionsRes.results || sectionsRes;

          setStudents(studentsData);
          setSessions(sessionsData);
          setClasses(classesData);
          setAllSections(sectionsData);

          // --- Session Auto-select Logic ---
          // यदि यो नयाँ इन्ट्री हो (Edit होइन भने), Active Session छान्नुहोस्
          if (!initialData) {
            const activeSession = sessionsData.find((s: any) => s.is_active === true);
            if (activeSession) {
              form.setValue("session", activeSession.id);
            }
          }
        } catch (err) {
          toast.error("Failed to load dropdown data");
        }
      };

      if (isOpen) fetchData();
    }, [isOpen, initialData, form]); // form र initialData पनि dependencies मा राख्नुहोस्

  useEffect(() => {
    if (selectedClass) {
      const filtered = allSections.filter(
        (sec: any) => String(sec.class_assigned?.id || sec.class_assigned) === String(selectedClass)
      );
      setFilteredSections(filtered);
    } else {
      setFilteredSections([]);
      form.setValue("section", null);
      setCalculatedRoll(null);
    }
  }, [selectedClass, allSections, form]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          student: initialData.student?.id || initialData.student,
          school: initialData.school?.id || initialData.school || (loggedInUser?.school_id ? Number(loggedInUser.school_id) : null),
          session: initialData.session?.id || initialData.session,
          class_assigned: initialData.class_assigned?.id || initialData.class_assigned,
          section: initialData.section?.id || initialData.section,
          is_active: initialData.is_active ?? true,
          roll_number: initialData.roll_number,
        });
      } else {
        form.reset({
          student: null,
          school: loggedInUser?.school_id ? Number(loggedInUser.school_id) : null,
          session: loggedInUser?.active_session_id || null,
          class_assigned: null,
          section: null,
          is_active: true,
          roll_number: null,
        });
        setCalculatedRoll(null);
      }
    }
  }, [initialData, isOpen, loggedInUser, form]);

const onSubmit = async (values: EnrollmentFormValues) => {
    setLoading(true);

    
    const payload = {
      ...values,
      school: values.school || (loggedInUser?.school_id ? Number(loggedInUser.school_id) : null),
      roll_number: values.roll_number,
      student: values.student,
      session: values.session,
      class_assigned: values.class_assigned,
      section: values.section,
    };

    try {
      if (isUpdate) {
        await EnrollmentServices.updateEnrollment(initialData.id, payload);
        toast.success("Enrollment updated successfully");
      } else {
        await EnrollmentServices.createEnrollment(payload);
        toast.success(`Student enrolled with Roll No: ${values.roll_number}`);

        form.reset({
          student: null,
          school: loggedInUser?.school_id ? Number(loggedInUser.school_id) : null,
          session: loggedInUser?.active_session_id || null, // Active session पुनः सेट गर्नुहोस्
          class_assigned: null,
          section: null,
          is_active: true,
          roll_number: null,
        });
        setCalculatedRoll(null); 
      }

      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err: any) {
      const serverErrors = err.response?.data;
      
      if (serverErrors) {        if (serverErrors.non_field_errors) {
          toast.error(serverErrors.non_field_errors[0]);
        } else if (serverErrors.detail) {
          toast.error(serverErrors.detail);
        } else {
          Object.keys(serverErrors).forEach((key) => {
            const errorValue = serverErrors[key];
            const message = Array.isArray(errorValue) ? errorValue[0] : errorValue;
            toast.error(`${key.toUpperCase()}: ${message}`);
          });
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: primaryColor,
                borderRadius: 4,
                controlOutline: `${primaryColor}1A`,
              },
            }}
          >
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Enrollment" : "Student Enrollment Registration"}
              </h2>
              <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                
                {/* Student Select */}
                <FormItem className="w-full">
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <GraduationCap size={12} /> Select Student
                  </label>
                  <Controller
                    name="student"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        showSearch
                        className="w-full h-[33px]"
                        placeholder="Search by ID or Name"
                        optionFilterProp="label"
                        options={students.map((s: any) => ({
                          value: s.id,
                          label: `${s.first_name_display || s.user?.first_name || ""} ${s.last_name_display || s.user?.last_name || ""} (${s.student_id})`,
                        }))}
                        disabled={isUpdate}
                      />
                    )}
                  />
                </FormItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <CalendarDays size={12} /> Academic Session
                    </label>
                    <Controller
                      name="session"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full h-[33px]"
                          placeholder="Select Session"
                          options={sessions.map((s: any) => ({
                            value: s.id,
                            label: s.name,
                          }))}
                        />
                      )}
                    />
                  </FormItem>

                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <CheckCircle2 size={12} /> Enrollment Status
                    </label>
                    <div className="h-[33px] flex items-center gap-3 px-3 bg-gray-50 rounded border border-gray-200">
                      <Controller
                        name="is_active"
                        control={form.control}
                        render={({ field: { value, onChange } }) => (
                          <Switch checked={value} onChange={onChange} size="small" />
                        )}
                      />
                      <span className="text-[12px] text-gray-600 font-medium">
                        {form.watch("is_active") ? "Currently Active" : "Inactive"}
                      </span>
                    </div>
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Layers size={12} /> Class Assigned
                    </label>
                    <Controller
                      name="class_assigned"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full h-[33px]"
                          placeholder="Assign Class"
                          options={[...classes].reverse().map((c: any) => ({
                            value: c.id,
                            label: c.name,
                          }))}
                        />
                      )}
                    />
                  </FormItem>

                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Hash size={12} /> Section
                    </label>
                    <Controller
                      name="section"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full h-[33px]"
                          placeholder="Assign Section"
                          disabled={!selectedClass}
                          options={filteredSections.map((s: any) => ({
                            value: s.id,
                            label: s.name,
                          }))}
                        />
                      )}
                    />
                  </FormItem>
                </div>

                {/* Calculation Info Box */}
                {(calculatedRoll !== null || isUpdate) && (
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500 rounded text-white">
                        <Hash size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Assigned Roll Number</span>
                        <span className="text-lg font-black text-emerald-700 leading-none">
                          {isUpdate ? initialData.roll_number : calculatedRoll}
                        </span>
                      </div>
                    </div>
                    {!isUpdate && (
                      <span className="text-[10px] text-emerald-500 font-medium italic flex items-center gap-1">
                        <Info size={10} /> Auto-calculated based on section
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Save size={12} />
                      )}
                      <span>
                        {isUpdate ? "Update Enrollment" : "Enroll Now"}
                      </span>
                    </div>
                  </ThemedButton>
                </div>
              </form>
            </Form>
          </ConfigProvider>
        </div>
      </div>
    </>
  );
}