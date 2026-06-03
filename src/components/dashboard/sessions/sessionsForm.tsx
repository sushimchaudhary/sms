"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Calendar,
  GraduationCap,
  Save,
  Loader2,
  X,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Switch } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import { SessionServices } from "@/services/sessionsServices";
import useAuth from "@/lib/hooks/useAuth";
import { SchoolServices } from "@/services/schoolServices";
import cookies from "js-cookie";
import NepaliDate from "nepali-date-converter";

// ─── install: npm install nepali-datepicker-reactjs ───
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import CalendarPicker from "@/components/ui/Calendar";

interface SessionsFormValues {
  name: string;
  start_date: string; // stored as AD: YYYY-MM-DD (for API)
  end_date: string; // stored as AD: YYYY-MM-DD (for API)
  school: any;
  is_active: boolean;
}

// ── Helpers ──────────────────────────────────────────────

/** AD "YYYY-MM-DD" → BS "YYYY-MM-DD" (for the picker value) */
const adToBSValue = (adStr: string): string => {
  if (!adStr) return "";
  try {
    const nd = new NepaliDate(new Date(adStr));
    const y = nd.getYear();
    const m = String(nd.getMonth() + 1).padStart(2, "0");
    const d = String(nd.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return "";
  }
};

/** BS "YYYY-MM-DD" → AD "YYYY-MM-DD" (to save in form state) */
const bsToADValue = (bsStr: string): string => {
  if (!bsStr) return "";
  try {
    const [y, m, d] = bsStr.split("-").map(Number);
    const nd = new NepaliDate(y, m - 1, d);
    const ad = nd.toJsDate();
    const ay = ad.getFullYear();
    const am = String(ad.getMonth() + 1).padStart(2, "0");
    const adDay = String(ad.getDate()).padStart(2, "0");
    return `${ay}-${am}-${adDay}`;
  } catch {
    return "";
  }
};

// ── Component ─────────────────────────────────────────────

export default function SessionsForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState<string>("");

  const form = useForm<SessionsFormValues>({
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
      school: "",
      is_active: true,
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  useEffect(() => {
    const fetchSchoolName = async () => {
      const userInfoCookie = cookies.get("user_info");
      const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
      const schoolId =
        loggedInUser?.school_id ||
        loggedInUser?.school ||
        cookieUser?.school_id ||
        cookieUser?.school;
      if (!schoolId) return;
      try {
        const res = await SchoolServices.getSingleSchool(schoolId);
        const name =
          res?.data?.name ||
          res?.name ||
          res?.data?.school_name ||
          res?.school_name;
        setSchoolName(name || "");
      } catch {
        setSchoolName("");
      }
    };
    fetchSchoolName();
  }, [loggedInUser]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const schoolValue =
          schoolName ||
          (typeof initialData.school === "object"
            ? initialData.school?.name
            : "") ||
          "N/A";
        form.reset({
          name: initialData.name || "",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
          school: schoolValue,
          is_active: initialData.is_active ?? true,
        });
      } else {
        form.reset({
          name: "",
          start_date: "",
          end_date: "",
          school: schoolName || "N/A",
          is_active: true,
        });
      }
    }
  }, [initialData, form, isOpen, schoolName]);

  const onSubmit = async (values: SessionsFormValues) => {
    setLoading(true);
    try {
      const sessionId = initialData?.id || initialData?._id;
      const payload = {
        name: values.name,
        start_date: values.start_date,
        end_date: values.end_date,
        is_active: values.is_active,
        school:
          initialData?.school?.id ||
          initialData?.school ||
          loggedInUser?.school_id ||
          loggedInUser?.school,
      };

      if (isUpdate) {
        await SessionServices.updateSession(sessionId, payload);
        toast.success("Session updated successfully!");
      } else {
        await SessionServices.createSession(payload);
        toast.success("Session created successfully!");
      }

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      const serverErrors = err.response?.data;
      if (serverErrors) {
        if (typeof serverErrors === "object" && !serverErrors.detail) {
          Object.keys(serverErrors).forEach((key) => {
            const errorValue = serverErrors[key];
            const message = Array.isArray(errorValue)
              ? errorValue[0]
              : errorValue;
            const fieldName =
              key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ");
            toast.error(`${fieldName}: ${message}`);
          });
        } else if (serverErrors.detail) {
          toast.error(serverErrors.detail);
        } else {
          toast.error("An error occurred on the server.");
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── कम्पोनेन्ट भित्र यो नयाँ useEffect थप्नुहोस् ───
  useEffect(() => {
    if (!isOpen) return;

    // body मा नयाँ एलिमेन्ट (क्यालेन्डर) थपिने बित्तिकै समात्ने अब्जर्भर
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node: any) => {
          // यदि थपिएको एलिमेन्ट क्यालेन्डर हो भने वा त्यसभित्र क्यालेन्डर क्लास छ भने
          if (
            node.nodeType === 1 &&
            (node.classList?.contains("np-calendar-wrapper") ||
              node.querySelector?.(".np-calendar-wrapper"))
          ) {
            const cal = node.classList?.contains("np-calendar-wrapper")
              ? node
              : node.querySelector(".np-calendar-wrapper");

            if (cal) {
              // सिधै इन्लाइन स्टाइल ठोकिदिने ताकि कसैले ओभरराइड गर्न नसकोस्
              cal.style.position = "absolute";
              cal.style.setProperty("transform", "scale(0.7)", "important");
              cal.style.setProperty(
                "transform-origin",
                "bottom left",
                "important",
              );

              // इन्पुट बक्सको माथितिर देखाउन (image_40511e.jpg को समस्या फिक्स गर्न)
              cal.style.setProperty("bottom", "100%", "important");
              cal.style.setProperty("top", "auto", "important");
              cal.style.setProperty("margin-bottom", "40px", "important"); // अलिकति माथि ग्याप राखिएको
              cal.style.setProperty("z-index", "999999", "important");
            }
          }
        });
      });
    });

    // body लाई चियाएर बस्न सुरु गर्ने
    observer.observe(document.body, { childList: true, subtree: true });

    // मोडल बन्द हुँदा सफा गर्ने
    return () => observer.disconnect();
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Modal - ध्यान दिनुहोस्: यहाँ 'overflow-visible' राखिएको छ */}
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-2xl">
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: primaryColor,
                borderRadius: 4,
                controlOutlineWidth: 1,
                controlOutline: `${primaryColor}1A`,
              },
              components: {
                Input: { activeBorderColor: primaryColor },
                Select: { colorPrimaryHover: primaryColor },
              },
            }}
          >
            <div className="w-full bg-white rounded shadow-md border border-gray-200 overflow-visible font-mukta">
              {/* Header */}
              <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardList size={15} style={{ color: primaryColor }} />
                  {isUpdate ? "Edit Session Details" : "Create New Session"}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-red-500 hover:rotate-90 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="px-6 py-5 space-y-4"
                >
                  {/* Name + School */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormFieldControl
                      form={form}
                      name="name"
                      label="Session Name"
                      placeholder="Academic Year 2083"
                      icon={<ClipboardList size={12} />}
                    />
                    <FormFieldControl
                      form={form}
                      name="school"
                      label="Assigned Institution"
                      icon={<GraduationCap size={12} />}
                      disabled={true}
                    />
                  </div>

                  {/* Date Fields — BS Nepali Pickers */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* ─── Start Date ─── */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        Start Date (BS)
                      </label>
                      <Controller
                        name="start_date"
                        control={form.control}
                        render={({ field }) => (
                          // <div
                          //   className="nepali-datepicker-wrapper"
                          //   // क्लिक गर्ने बित्तिकै DOM मा क्यालेन्डर खोजेर स्टाइल चेन्ज हान्ने
                          //   onClick={() => {
                          //     setTimeout(() => {
                          //       const calendars = document.querySelectorAll(
                          //         ".np-calendar-wrapper",
                          //       );
                          //       calendars.forEach((cal: any) => {
                          //         cal.style.position = "absolute";
                          //         cal.style.setProperty(
                          //           "transform",
                          //           "scale(0.7)",
                          //           "important",
                          //         );
                          //         cal.style.setProperty(
                          //           "transform-origin",
                          //           "bottom left",
                          //           "important",
                          //         );
                          //         cal.style.setProperty(
                          //           "bottom",
                          //           "100%",
                          //           "important",
                          //         );
                          //         cal.style.setProperty(
                          //           "top",
                          //           "auto",
                          //           "important",
                          //         );
                          //         cal.style.setProperty(
                          //           "margin-bottom",
                          //           "10px",
                          //           "important",
                          //         );
                          //         cal.style.setProperty(
                          //           "z-index",
                          //           "999999",
                          //           "important",
                          //         );
                          //       });
                          //     }, 50); // क्यालेन्डर रेन्डर हुन ५०ms को ग्याप
                          //   }}
                          // >
                          //   <NepaliDatePicker
                          //     inputClassName="form-control"
                          //     value={adToBSValue(field.value)}
                          //     onChange={(bsVal: string) =>
                          //       field.onChange(bsToADValue(bsVal))
                          //     }
                          //     options={{
                          //       calenderLocale: "ne",
                          //       valueLocale: "en",
                          //     }}
                          //   />
                          // </div>

                           <CalendarPicker 
                            value={field.value} 
                            onChange={(date) => field.onChange(date)}
                            />
                        )}
                      />
                    </div>

                    {/* ─── End Date ─── */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        End Date (BS)
                      </label>
                      <Controller
                        name="end_date"
                        control={form.control}
                        render={({ field }) => (
                          <div className="nepali-datepicker-wrapper-custom w-full">
                            {/* <NepaliDatePicker
                              className="!w-[300px] !h-[33px]" 
                              inputClassName="w-full h-[33px] px-2 text-[11px] border border-gray-300 rounded focus:border-blue-500 outline-none"

                              value={adToBSValue(field.value)}
                              onChange={(bsVal: string) =>
                                field.onChange(bsToADValue(bsVal))
                              }
                              options={{
                                calenderLocale: "ne",
                                valueLocale: "en",
                              }}
                            /> */}


                            <CalendarPicker 
        value={field.value} 
        onChange={(date) => field.onChange(date)} 
      />
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* Session Status */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 h-[32px] mt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <ShieldCheck size={12} style={{ color: primaryColor }} />
                      Session Status (
                      {form.watch("is_active") ? "Active" : "Inactive"})
                    </span>
                    <Controller
                      name="is_active"
                      control={form.control}
                      render={({ field }) => (
                        <Switch
                          size="small"
                          checked={field.value}
                          onChange={field.onChange}
                          style={{
                            backgroundColor: field.value
                              ? primaryColor
                              : "#d1d5db",
                          }}
                        />
                      )}
                    />
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <CancelButton onClick={handleClose} disabled={loading} />
                    <ThemedButton type="submit" size="sm" disabled={loading}>
                      <div className="flex items-center gap-2">
                        {loading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        <span>
                          {isUpdate ? "Update Session" : "Save Session"}
                        </span>
                      </div>
                    </ThemedButton>
                  </div>
                </form>
              </Form>
            </div>
          </ConfigProvider>
        </div>
      </div>

      {/* Override picker styles to match your theme */}
      <style>{`
  .nepali-datepicker-wrapper {
    position: relative;
  }
  .nepali-datepicker-wrapper input {
    width: 100% !important;
    height: 32px !important;
    font-size: 12px !important;
    border: 1px solid #d1d5db !important;
    border-radius: 4px !important;
    padding: 0 8px !important;
    outline: none !important;
  }
`}</style>
    </>
  );
}

const FormFieldControl = ({
  form,
  name,
  label,
  icon,
  placeholder,
  type = "text",
  disabled = false,
}: any) => (
  <Controller
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem className="w-full">
        <ThemedInput
          label={label}
          icon={icon}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          {...field}
        />
        <FormMessage className="text-[10px]" />
      </FormItem>
    )}
  />
);
