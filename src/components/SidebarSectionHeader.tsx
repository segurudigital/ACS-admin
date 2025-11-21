interface SidebarSectionHeaderProps {
  title: string;
  collapsed?: boolean;
}

export default function SidebarSectionHeader({ title, collapsed }: SidebarSectionHeaderProps) {
  if (collapsed) {
    return <div className="h-px bg-white/10 mx-4 my-2" />;
  }

  return (
    <div className="px-4 py-1 mt-3 first:mt-0">
      <div className="h-px bg-white/10 mb-1" />
      <h3 className="text-xs font-medium text-white uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
}