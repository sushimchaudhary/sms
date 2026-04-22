

interface PageHeaderProps {
  title: string;
  description?: string;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div className="mb-1">
      <h2 className="text-[22px] font-bold text-[#526484] tracking-tight leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-[13px] text-[#8094ae] font-medium mt-0.5">
          {description}
        </p>
      )}
    </div>
  );
};