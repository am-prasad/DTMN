"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle } from "lucide-react";
import type { AdmissionEnquiryForm, AdmissionInfo } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { api } from "@/lib/api";

const schema = z.object({
  student_name: z.string().min(2, "Student name is required").max(255),
  parent_name: z.string().min(2, "Parent name is required").max(255),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Valid phone required").max(30),
  section: z.enum(["nursery", "primary", "high-school", "college"]),
  message: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdmissionsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admissionInfo, setAdmissionInfo] = useState<AdmissionInfo | null>(null);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch admission info & site content
    api.admissions
      .getInfo("general")
      .then(setAdmissionInfo)
      .catch(() => {});

    api.content
      .list("contact")
      .then((items) => {
        setSiteContent(Object.fromEntries(items.map((i) => [i.key, i.value ?? ""])));
      })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const payload: AdmissionEnquiryForm = {
        student_name: data.student_name,
        parent_name: data.parent_name,
        email: data.email,
        phone: data.phone,
        section: data.section,
        message: data.message,
      };

      await api.admissions.submitEnquiry(payload);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.detail || "Submission failed. Please try again.");
    }
  };

  const instName =
    siteContent.institution_name && !siteContent.institution_name.startsWith("[")
      ? siteContent.institution_name
      : "our institution";
  const admPhone =
    siteContent.admission_contact_phone && !siteContent.admission_contact_phone.startsWith("[")
      ? siteContent.admission_contact_phone
      : siteContent.institution_phone && !siteContent.institution_phone.startsWith("[")
      ? siteContent.institution_phone
      : "";
  const admEmail =
    siteContent.admission_contact_email && !siteContent.admission_contact_email.startsWith("[")
      ? siteContent.admission_contact_email
      : siteContent.institution_email && !siteContent.institution_email.startsWith("[")
      ? siteContent.institution_email
      : "";

  return (
    <>
      <PageHeader
        title="Admissions"
        description={`Apply for admission to ${instName} for the upcoming academic session.`}
        breadcrumbs={[{ label: "Admissions" }]}
      />

      <div className="section bg-white">
        <div className="container-site max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <h2 className="section-title">Admission Information</h2>
              <div className="mt-5 space-y-5 text-sm text-neutral-600 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-neutral-800 mb-1">Overview</h3>
                  <p>
                    {admissionInfo?.overview ||
                      "Admissions are open for the upcoming academic session across all sections — Nursery, Primary School, High School, and College. We follow a transparent and straightforward admission process."}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-800 mb-1">Required Documents</h3>
                  {admissionInfo?.documents_required ? (
                    <div className="whitespace-pre-line text-neutral-600">
                      {admissionInfo.documents_required}
                    </div>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Birth Certificate</li>
                      <li>Transfer Certificate (from previous school, if applicable)</li>
                      <li>Mark sheets from the previous academic year</li>
                      <li>Recent passport-size photographs (4)</li>
                      <li>Address proof</li>
                      <li>Medical fitness certificate</li>
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-800 mb-1">Admission Process</h3>
                  {admissionInfo?.process ? (
                    <div className="whitespace-pre-line text-neutral-600">
                      {admissionInfo.process}
                    </div>
                  ) : (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Submit the enquiry form on this page</li>
                      <li>Collect the prospectus from the admissions office</li>
                      <li>Submit the completed application with documents</li>
                      <li>Attend the interaction/assessment session (for applicable classes)</li>
                      <li>Admission confirmation and fee payment</li>
                    </ol>
                  )}
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-card p-4">
                  <h3 className="font-semibold text-neutral-800 mb-1">Admissions Contact</h3>
                  {admPhone && (
                    <p>
                      Telephone:{" "}
                      <a href={`tel:${admPhone.replace(/\s+/g, "")}`} className="text-primary font-medium">
                        {admPhone}
                      </a>
                    </p>
                  )}
                  {admEmail && (
                    <p>
                      Email:{" "}
                      <a href={`mailto:${admEmail}`} className="text-primary font-medium">
                        {admEmail}
                      </a>
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 mt-2">
                    Office hours: Monday to Saturday, 9:00 AM – 3:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Enquiry form */}
            <div>
              <h2 className="section-title">Submit an Enquiry</h2>

              {submitted ? (
                <div className="mt-6 text-center py-10">
                  <CheckCircle
                    className="h-10 w-10 text-green-500 mx-auto mb-3"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold text-neutral-900">Enquiry Submitted</h3>
                  <p className="text-sm text-neutral-600 mt-2">
                    Thank you. Our admissions team will contact you within 2 working days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="adm-student-name" className="form-label">
                      Student&apos;s Name *
                    </label>
                    <input
                      id="adm-student-name"
                      type="text"
                      {...register("student_name")}
                      className="form-input"
                      aria-required="true"
                    />
                    {errors.student_name && (
                      <p className="form-error">{errors.student_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="adm-parent-name" className="form-label">
                      Parent / Guardian Name *
                    </label>
                    <input
                      id="adm-parent-name"
                      type="text"
                      {...register("parent_name")}
                      className="form-input"
                      aria-required="true"
                    />
                    {errors.parent_name && (
                      <p className="form-error">{errors.parent_name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="adm-email" className="form-label">
                        Email Address *
                      </label>
                      <input
                        id="adm-email"
                        type="email"
                        {...register("email")}
                        className="form-input"
                        aria-required="true"
                      />
                      {errors.email && <p className="form-error">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="adm-phone" className="form-label">
                        Phone Number *
                      </label>
                      <input
                        id="adm-phone"
                        type="tel"
                        {...register("phone")}
                        className="form-input"
                        aria-required="true"
                      />
                      {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="adm-section" className="form-label">
                      Applying For Section *
                    </label>
                    <select
                      id="adm-section"
                      {...register("section")}
                      className="form-select"
                      aria-required="true"
                    >
                      <option value="">Select a section</option>
                      <option value="nursery">Nursery / Kindergarten</option>
                      <option value="primary">Primary School (I – V)</option>
                      <option value="high-school">High School (VI – X)</option>
                      <option value="college">College (XI – XII)</option>
                    </select>
                    {errors.section && <p className="form-error">{errors.section.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="adm-message" className="form-label">
                      Message / Queries (Optional)
                    </label>
                    <textarea
                      id="adm-message"
                      rows={3}
                      {...register("message")}
                      className="form-textarea"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full py-2.5"
                  >
                    {isSubmitting ? "Submitting…" : "Submit Enquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
