"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
  User,
  Save,
  Loader2,
  Mail,
  Lock,
  UserCircle,
  Eye,
  EyeOff,
  Camera,
  Phone,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Users,
  Calendar,
} from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select } from "antd";
import { AdmissionServices } from "@/services/admissionServices";
import useAuth from "@/lib/hooks/useAuth";
import cookies from "js-cookie";
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import NepaliDate from "nepali-date-converter";
import "nepali-datepicker-reactjs/dist/index.css";
import { SessionServices } from "@/services/sessionsServices";
import { ClassServices } from "@/services/classServices";
import { SectionServices } from "@/services/sectionServices";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudentEntry {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  dob: string;
  gender: string | null;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
  photo?: File | null;
}

interface AdmissionFormValues {
  parent_first_name: string;
  parent_last_name: string;
  parent_email: string;
  parent_phone: string;
  parent_password: string;
  parent_photo?: File | null;
  students: StudentEntry[];
}

// ── Date helpers ──────────────────────────────────────────────────────────────

const adToBSValue = (adStr: string): string => {
  if (!adStr) return "";
  try {
    const nd = new NepaliDate(new Date(adStr));
    return `${nd.getYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

const bsToADValue = (bsStr: string): string => {
  if (!bsStr) return "";
  try {
    const [y, m, d] = bsStr.split("-").map(Number);
    const ad = new NepaliDate(y, m - 1, d).toJsDate();
    return `${ad.getFullYear()}-${String(ad.getMonth() + 1).padStart(2, "0")}-${String(ad.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_STUDENT: StudentEntry = {
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  dob: "",
  gender: null,
  session_id: "",
  class_id: "",
  section_id: "",
  photo: null,
};

// ── Main Component ────────────────────────────────────────────────────────────
// Inline (non-modal) version — no isOpen, onClose, backdrop, or fixed positioning

export default function AdmissionFormInline({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // ── Dropdown data (fetched on mount) ─────────────────────────────────────
  const [sessions, setSessions] = useState<
    { id: number | string; name: string }[]
  >([]);
  const [classes, setClasses] = useState<
    { id: number | string; name: string }[]
  >([]);
  const [sections, setSections] = useState<
    { id: number | string; name: string }[]
  >([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // ── Photo states ──────────────────────────────────────────────────────────
  const [parentPhotoPreview, setParentPhotoPreview] = useState<string | null>(
    null,
  );
  const [studentPhotoPreviews, setStudentPhotoPreviews] = useState<
    (string | null)[]
  >([null]);

  const parentPhotoRef = useRef<HTMLInputElement>(null);
  // Stable ref object keyed by student index — fixes clickable issue
  const studentPhotoInputRefs = useRef<{
    [key: number]: HTMLInputElement | null;
  }>({});

  const form = useForm<AdmissionFormValues>({
    defaultValues: {
      parent_first_name: "",
      parent_last_name: "",
      parent_email: "",
      parent_phone: "",
      parent_password: "",
      parent_photo: null,
      students: [{ ...EMPTY_STUDENT }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "students",
  });

  // ── Fetch dropdown data on mount (no isOpen needed) ───────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setDropdownLoading(true);
      try {
        const [sessionRes, classRes, sectionRes] = await Promise.all([
          SessionServices.getSessions(),
          ClassServices.getAllClasses(),
          SectionServices.getAllSections(),
        ]);
        setSessions(sessionRes.results || sessionRes || []);
        setClasses(classRes.results || classRes || []);
        setSections(sectionRes.results || sectionRes || []);
      } catch {
        toast.error("Failed to load dropdown data");
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchData();
  }, []); // runs once on mount

  // ── Reset form helper ─────────────────────────────────────────────────────
  const resetForm = () => {
    form.reset({
      parent_first_name: "",
      parent_last_name: "",
      parent_email: "",
      parent_phone: "",
      parent_password: "",
      parent_photo: null,
      students: [{ ...EMPTY_STUDENT }],
    });
    setStep(1);
    setParentPhotoPreview(null);
    setStudentPhotoPreviews([null]);
    studentPhotoInputRefs.current = {};
  };

  // ── Photo handlers ────────────────────────────────────────────────────────

  const handleParentPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    form.setValue("parent_photo", file);
    const reader = new FileReader();
    reader.onloadend = () => setParentPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleStudentPhoto = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    form.setValue(`students.${index}.photo`, file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setStudentPhotoPreviews((prev) => {
        const next = [...prev];
        next[index] = reader.result as string;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const triggerStudentPhotoInput = (index: number) => {
    studentPhotoInputRefs.current[index]?.click();
  };

  // ── Step navigation ───────────────────────────────────────────────────────

  const handleNextStep = async () => {
    const ok = await form.trigger([
      "parent_first_name",
      "parent_last_name",
      "parent_email",
      "parent_phone",
      "parent_password",
    ]);
    if (!ok) return;
    setStep(2);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit1 = async (values: AdmissionFormValues) => {
    setLoading(true);
    try {
      const userInfoCookie = cookies.get("user_info");
      const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
      const schoolId =
        loggedInUser?.school_id ||
        loggedInUser?.school ||
        cookieUser?.school_id;

      const payload: any = {
        parent: {
          email: values.parent_email,
          first_name: values.parent_first_name,
          last_name: values.parent_last_name,
          phone: values.parent_phone,
          password: values.parent_password,
          school_id: schoolId,
        },
        students: values.students.map((s) => ({
          email: s.email,
          first_name: s.first_name,
          last_name: s.last_name,
          password: s.password,
          dob: s.dob || null,
          gender: s.gender || null,
          session_id: s.session_id,
          class_id: s.class_id,
          section_id: s.section_id,
          school_id: schoolId,
        })),
      };

      await AdmissionServices.createAdmission(payload);
      toast.success("Admission completed successfully!");
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      const serverErrors = err.response?.data;
      if (serverErrors && typeof serverErrors === "object") {
        Object.entries(serverErrors).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : val;
          const label =
            key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ");
          toast.error(`${label}: ${msg}`);
        });
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: AdmissionFormValues) => {
    setLoading(true);
    try {
      const userInfoCookie = cookies.get("user_info");
      const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
      const schoolId =
        loggedInUser?.school_id ||
        loggedInUser?.school ||
        cookieUser?.school_id;

      // १. ब्याकइन्डले खोजे अनुसार छुट्टाछुट्टै parent र students अब्जेक्ट बनाउने
      const parentPayload = {
        email: values.parent_email,
        first_name: values.parent_first_name,
        last_name: values.parent_last_name,
        phone: values.parent_phone,
        password: values.parent_password,
        school_id: schoolId,
      };

      const studentsPayload = values.students.map((s) => ({
        email: s.email,
        first_name: s.first_name,
        last_name: s.last_name,
        password: s.password,
        dob: s.dob || null,
        gender: s.gender || null,
        session_id: s.session_id,
        class_id: s.class_id,
        section_id: s.section_id,
        school_id: schoolId,
      }));

      const formData = new FormData();

      // २. ब्याकइन्डको json.loads() ले चिन्ने गरी छुट्टाछुट्टै stringify गरेर एपेन्ड गर्ने
      formData.append("parent", JSON.stringify(parentPayload));
      formData.append("students", JSON.stringify(studentsPayload));

      // ३. Parent को फोटो एपेन्ड गर्ने (ब्याकइन्डको request.FILES.get("parent_photo") को लागि)
      if (values.parent_photo) {
        formData.append("parent_photo", values.parent_photo);
      }

      // ४. प्रत्येक Student को फोटो एपेन्ड गर्ने (student_photo_0, student_photo_1 फर्म्याटमा)
      values.students.forEach((s, i) => {
        if (s.photo) {
          formData.append(`student_photo_${i}`, s.photo);
        }
      });

      // ५. API Call मा formData पठाउने
      await AdmissionServices.createAdmission(formData);

      toast.success("Admission completed successfully!");
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      const serverErrors = err.response?.data;
      if (serverErrors && typeof serverErrors === "object") {
        Object.entries(serverErrors).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : val;
          const label =
            key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ");
          toast.error(`${label}: ${msg}`);
        });
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded shadow-md border border-gray-200 overflow-hidden ">
      <ConfigProvider
        theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}
      >
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <UserCircle size={15} style={{ color: primaryColor }} />
            New Student Admission
          </h2>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <StepDot
              number={1}
              active={step === 1}
              done={step > 1}
              label="Parent info"
              primaryColor={primaryColor}
            />
            <div
              className={`flex-1 h-0.5 transition-colors ${step > 1 ? "bg-green-500" : "bg-gray-200"}`}
            />
            <StepDot
              number={2}
              active={step === 2}
              done={false}
              label="Student details"
              primaryColor={primaryColor}
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* ── Step 1: Parent ──────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-2">
                  {/* Parent photo */}
                  <div className="flex flex-col items-center justify-center pb-4 border-b border-dashed border-gray-200">
                    <div
                      className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all"
                      style={{
                        borderColor: parentPhotoPreview
                          ? primaryColor
                          : "#e5e7eb",
                      }}
                      onClick={() => parentPhotoRef.current?.click()}
                    >
                      {parentPhotoPreview ? (
                        <img
                          src={parentPhotoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera size={30} className="text-gray-300" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={parentPhotoRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleParentPhoto}
                    />
                    <p className="text-[11px] text-gray-400 mt-2">
                      Upload Profile Photo (Max 5MB)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FieldControl
                      form={form}
                      name="parent_first_name"
                      label="First Name"
                      icon={<User size={12} />}
                      placeholder="name"
                      rules={{ required: "Required" }}
                    />
                    <FieldControl
                      form={form}
                      name="parent_last_name"
                      label="Last Name"
                      icon={<User size={12} />}
                      placeholder="surname"
                      rules={{ required: "Required" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldControl
                      form={form}
                      name="parent_email"
                      label="Email"
                      icon={<Mail size={12} />}
                      placeholder="parent@example.com"
                      // rules={{ required: "Required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } }}
                    />
                    <Controller
                      control={form.control}
                      name="parent_phone"
                      rules={{
                        required: "Required",
                        minLength: { value: 10, message: "Must be 10 digits" },
                      }}
                      render={({ field, fieldState }) => (
                        <FormItem className="w-full">
                          <ThemedInput
                            label="Phone Number"
                            icon={<Phone size={12} />}
                            placeholder="98XXXXXXXX"
                            type="text"
                            {...field}
                            onChange={(e) => {
                              const clean = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10);
                              field.onChange(clean);
                            }}
                          />
                          {fieldState.error && (
                            <p className="text-[10px] text-red-500 mt-1">
                              {fieldState.error.message}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  <FieldControl
                    form={form}
                    name="parent_password"
                    label="Password"
                    icon={<Lock size={12} />}
                    placeholder="Create password"
                    type="password"
                    // rules={{ required: "Required", minLength: { value: 6, message: "Min 6 chars" } }}
                  />
                </div>
              )}

              {/* ── Step 2: Students ────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* Parent summary */}
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded p-3 text-xs text-green-800">
                    <CheckCircle
                      size={14}
                      className="text-green-600 flex-shrink-0"
                    />
                    <span>
                      Parent{" "}
                      <strong>
                        {form.getValues("parent_first_name")}{" "}
                        {form.getValues("parent_last_name")}
                      </strong>{" "}
                      info saved — now add student(s)
                    </span>
                  </div>

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border border-gray-200 rounded px-3 py-1 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
                          <Users size={12} style={{ color: primaryColor }} />
                          Student {index + 1}
                        </p>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              remove(index);
                              setStudentPhotoPreviews((prev) =>
                                prev.filter((_, i) => i !== index),
                              );
                              delete studentPhotoInputRefs.current[index];
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Student photo — ref stored in object by index */}
                      <div className="flex flex-col items-center justify-center pb-3">
                        <div
                          className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all"
                          style={{
                            borderColor: studentPhotoPreviews[index]
                              ? primaryColor
                              : "#e5e7eb",
                          }}
                          onClick={() => triggerStudentPhotoInput(index)}
                        >
                          {studentPhotoPreviews[index] ? (
                            <img
                              src={studentPhotoPreviews[index]!}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera size={20} className="text-gray-300" />
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          ref={(el) => {
                            studentPhotoInputRefs.current[index] = el;
                          }}
                          onChange={(e) => handleStudentPhoto(e, index)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FieldControl
                          form={form}
                          name={`students.${index}.first_name`}
                          label="First Name"
                          icon={<User size={12} />}
                          placeholder="First name"
                          rules={{ required: "Required" }}
                        />
                        <FieldControl
                          form={form}
                          name={`students.${index}.last_name`}
                          label="Last Name"
                          icon={<User size={12} />}
                          placeholder="Last name"
                          rules={{ required: "Required" }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldControl
                          form={form}
                          name={`students.${index}.email`}
                          label="Email"
                          icon={<Mail size={12} />}
                          placeholder="student@example.com"
                          // rules={{ required: "Required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } }}
                        />
                        <FieldControl
                          form={form}
                          name={`students.${index}.password`}
                          label="Password"
                          icon={<Lock size={12} />}
                          placeholder="Password"
                          type="password"
                          // rules={{
                          //   required: "Required",
                          //   minLength: { value: 6, message: "Min 6 chars" },
                          // }}
                        />
                      </div>

                      {/* Session / Class / Section */}
                      <div className="grid grid-cols-3 gap-3">
                        <FormItem className="w-full">
                          <label className="text-[12px] font-bold text-gray-700 mb-1 block">
                            Session
                          </label>
                          <Controller
                            name={`students.${index}.session_id`}
                            control={form.control}
                            rules={{ required: "Required" }}
                            render={({ field: f, fieldState }) => (
                              <>
                                <Select
                                  {...f}
                                  className="w-full h-[33px]"
                                  placeholder={
                                    dropdownLoading ? "Loading..." : "Session"
                                  }
                                  loading={dropdownLoading}
                                  options={sessions.map((s) => ({
                                    value: s.id,
                                    label: s.name,
                                  }))}
                                />
                                {fieldState.error && (
                                  <p className="text-[10px] text-red-500 mt-1">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </FormItem>
                        <FormItem className="w-full">
                          <label className="text-[12px] font-bold text-gray-700 mb-1 block">
                            Class
                          </label>
                          <Controller
                            name={`students.${index}.class_id`}
                            control={form.control}
                            rules={{ required: "Required" }}
                            render={({ field: f, fieldState }) => (
                              <>
                                <Select
                                  {...f}
                                  className="w-full h-[33px]"
                                  placeholder={
                                    dropdownLoading ? "Loading..." : "Class"
                                  }
                                  loading={dropdownLoading}
                                  options={classes.map((c) => ({
                                    value: c.id,
                                    label: c.name,
                                  }))}
                                />
                                {fieldState.error && (
                                  <p className="text-[10px] text-red-500 mt-1">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </FormItem>
                        <FormItem className="w-full">
                          <label className="text-[12px] font-bold text-gray-700 mb-1 block">
                            Section
                          </label>
                          <Controller
                            name={`students.${index}.section_id`}
                            control={form.control}
                            // rules={{ required: "Required" }}
                            render={({ field: f, fieldState }) => (
                              <>
                                <Select
                                  {...f}
                                  className="w-full h-[33px]"
                                  placeholder={
                                    dropdownLoading ? "Loading..." : "Section"
                                  }
                                  loading={dropdownLoading}
                                  options={sections.map((s) => ({
                                    value: s.id,
                                    label: s.name,
                                  }))}
                                />
                                {fieldState.error && (
                                  <p className="text-[10px] text-red-500 mt-1">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </FormItem>
                      </div>

                      {/* DOB + Gender */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormItem className="w-full">
                          <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                            <Calendar size={12} /> DOB (BS)
                          </label>
                          <Controller
                            name={`students.${index}.dob`}
                            control={form.control}
                            render={({ field: f }) => (
                              <NepaliDatePicker
                                inputClassName="w-full h-[33px] px-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary text-[#364a63]"
                                value={adToBSValue(f.value)}
                                onChange={(bsVal: string) =>
                                  f.onChange(bsToADValue(bsVal))
                                }
                                options={{
                                  calenderLocale: "ne",
                                  valueLocale: "en",
                                }}
                              />
                            )}
                          />
                        </FormItem>
                        <FormItem className="w-full">
                          <label className="text-[12px] font-bold text-gray-700 mb-1 block">
                            Gender
                          </label>
                          <Controller
                            name={`students.${index}.gender`}
                            control={form.control}
                            render={({ field: f }) => (
                              <Select
                                {...f}
                                className="w-full h-[33px]"
                                placeholder="--Select--"
                                options={[
                                  { value: "Male", label: "Male" },
                                  { value: "Female", label: "Female" },
                                  { value: "Other", label: "Other" },
                                ]}
                              />
                            )}
                          />
                        </FormItem>
                      </div>
                    </div>
                  ))}

                  {/* Add student button */}
                  <button
                    type="button"
                    onClick={() => {
                      append({ ...EMPTY_STUDENT });
                      setStudentPhotoPreviews((prev) => [...prev, null]);
                    }}
                    className="w-full border border-dashed rounded py-2 text-xs flex items-center justify-center gap-2 transition-colors hover:opacity-80"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    <Plus size={13} /> Add another student
                  </button>
                </div>
              )}

              {/* ── Footer ──────────────────────────────────────── */}
              <div className="flex justify-between gap-3 pt-4 mt-4 border-t border-gray-100">
                {step === 2 ? (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                ) : (
                  // No cancel button needed for inline — reset instead
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center gap-1 text-xs text-red-500 hover:border-red-600 border cursor-pointer border-gray-200 px-3 py-1.5 rounded"
                  >
                    Reset
                  </button>
                )}

                {step === 1 && (
                  <ThemedButton
                    type="button"
                    size="sm"
                    onClick={handleNextStep}
                  >
                    <div className="flex items-center gap-2">
                      Next — Add Students <ChevronRight size={12} />
                    </div>
                  </ThemedButton>
                )}

                {step === 2 && (
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Save size={12} />
                      )}
                      Submit Admission
                    </div>
                  </ThemedButton>
                )}
              </div>
            </form>
          </Form>
        </div>
      </ConfigProvider>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepDot({
  number,
  active,
  done,
  label,
  primaryColor,
}: {
  number: number;
  active: boolean;
  done: boolean;
  label: string;
  primaryColor: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors"
        style={{
          background: done ? "#22c55e" : active ? primaryColor : "#f3f4f6",
          borderColor: done ? "#22c55e" : active ? primaryColor : "#d1d5db",
          color: done || active ? "#fff" : "#6b7280",
        }}
      >
        {done ? <CheckCircle size={13} /> : number}
      </div>
      <span
        className={`text-xs ${active ? "font-bold text-gray-800" : "text-gray-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

function FieldControl({
  form,
  name,
  label,
  icon,
  placeholder,
  disabled = false,
  type = "text",
  rules = {},
}: any) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <Controller
      control={form.control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormItem className="w-full relative">
          <ThemedInput
            label={label}
            icon={icon}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            placeholder={placeholder}
            disabled={disabled}
            {...field}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[32px] text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          {fieldState.error && (
            <p className="text-[10px] text-red-500 mt-1">
              {fieldState.error.message}
            </p>
          )}
        </FormItem>
      )}
    />
  );
}
