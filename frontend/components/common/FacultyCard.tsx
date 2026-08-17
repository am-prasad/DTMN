import Image from "next/image";
import { UserCircle, Mail } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FacultyMember } from "@/types";

interface FacultyCardProps {
  faculty: FacultyMember;
  className?: string;
}

export function FacultyCard({ faculty, className }: FacultyCardProps) {
  const photoUrl = getImageUrl(faculty.photo);

  return (
    <article
      className={cn("card flex flex-col items-center text-center p-5", className)}
      aria-label={faculty.name}
    >
      {/* Photo */}
      <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-100 mb-3 flex-shrink-0 ring-2 ring-primary-100">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={faculty.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserCircle className="h-12 w-12 text-neutral-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-neutral-900 text-base">{faculty.name}</h3>
        <p className="text-sm text-primary font-medium mt-0.5">{faculty.designation}</p>
        {faculty.department && (
          <p className="text-xs text-neutral-500 mt-0.5">{faculty.department.name}</p>
        )}
        {faculty.qualification && (
          <p className="text-xs text-neutral-400 mt-1 italic">{faculty.qualification}</p>
        )}
        {faculty.experience_years !== undefined && faculty.experience_years !== null && (
          <p className="text-xs text-neutral-500 mt-1">
            {faculty.experience_years} {faculty.experience_years === 1 ? "year" : "years"} experience
          </p>
        )}
      </div>

      {/* Email */}
      {faculty.institutional_email && (
        <a
          href={`mailto:${faculty.institutional_email}`}
          className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary-700 transition-colors"
          aria-label={`Email ${faculty.name}`}
        >
          <Mail className="h-3.5 w-3.5" />
          {faculty.institutional_email}
        </a>
      )}
    </article>
  );
}
