import Link from "next/link";
export default function Home() {
  return (
    <div className="bg-neutral-100 flex flex-col gap-4 items-center justify-center  w-screen h-screen">

      <Link  href="/api/dossier" className="bg-transparent w-fit ">
        Accede al generador de dossier en {" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              /api/dossier
            </code>
      </Link>
      <Link href="/api/meeting-output" className="bg-transparent w-fit ">
        Accede al generador de resumen de reuniones en {" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              /api/meeting-output
            </code>
      </Link>
      <Link href="/api/meeting-output" className="bg-transparent w-fit ">
        Accede al data enrichment de Apollo en {" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              /api/apollo
            </code>
      </Link>
    
      <Link href="/api/meeting-output" className="bg-transparent w-fit ">
        Accede al extractor de cookies de Apollo en {" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              /api/credentials
            </code>
      </Link>
    
    
    </div>
  );
}
