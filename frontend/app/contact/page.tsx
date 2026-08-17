"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { api } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(300),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await api.contact.submit(data);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.detail || "Failed to send your message. Please try again or contact us by phone.");
    }
  };

  return (
    <>
      <PageHeader title="Contact Us" description="We'd love to hear from you." breadcrumbs={[{ label: "Contact" }]} />

      <div className="section bg-white">
        <div className="container-site max-w-2xl">
          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-neutral-900">Message Sent</h2>
              <p className="text-neutral-600 mt-2">
                Thank you for contacting us. We will respond within 2 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <h2 className="text-xl font-semibold text-neutral-900">Send Us a Message</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="form-label">Full Name <span aria-hidden="true" className="text-red-500">*</span></label>
                  <input id="contact-name" type="text" {...register("name")} className="form-input" autoComplete="name" aria-required="true" aria-describedby={errors.name ? "name-error" : undefined} />
                  {errors.name && <p id="name-error" className="form-error" role="alert">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className="form-label">Email Address <span aria-hidden="true" className="text-red-500">*</span></label>
                  <input id="contact-email" type="email" {...register("email")} className="form-input" autoComplete="email" aria-required="true" aria-describedby={errors.email ? "email-error" : undefined} />
                  {errors.email && <p id="email-error" className="form-error" role="alert">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="contact-phone" className="form-label">Phone Number <span className="text-neutral-400 text-xs">(optional)</span></label>
                <input id="contact-phone" type="tel" {...register("phone")} className="form-input" autoComplete="tel" />
              </div>

              <div>
                <label htmlFor="contact-subject" className="form-label">Subject <span aria-hidden="true" className="text-red-500">*</span></label>
                <input id="contact-subject" type="text" {...register("subject")} className="form-input" aria-required="true" aria-describedby={errors.subject ? "subject-error" : undefined} />
                {errors.subject && <p id="subject-error" className="form-error" role="alert">{errors.subject.message}</p>}
              </div>

              <div>
                <label htmlFor="contact-message" className="form-label">Message <span aria-hidden="true" className="text-red-500">*</span></label>
                <textarea id="contact-message" rows={5} {...register("message")} className="form-textarea" aria-required="true" aria-describedby={errors.message ? "message-error" : undefined} />
                {errors.message && <p id="message-error" className="form-error" role="alert">{errors.message.message}</p>}
              </div>

              {error && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? "Sending…" : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
