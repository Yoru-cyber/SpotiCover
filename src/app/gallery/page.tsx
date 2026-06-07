import { CoverGrid } from "@/components/gallery/cover-grid"

export const metadata = {
  title: "Galería - SpotiCover",
  description: "Tus portadas guardadas",
}

export default function GalleryPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-16">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Tus portadas
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Todas las portadas que has compartido y guardado.
          </p>
        </div>
        <CoverGrid />
      </div>
    </main>
  )
}