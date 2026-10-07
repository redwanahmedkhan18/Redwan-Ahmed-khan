import ResourceManager from "@/components/admin/ResourceManager";

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <ResourceManager resourceKey="skills" />;
}
