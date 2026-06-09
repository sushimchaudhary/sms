// QuestionTableSkeleton.tsx
import React from "react";

const shimmerClass = `
  @keyframes shimmer {
    0% { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .sk {
    background: linear-gradient(90deg, #f1f5f9 25%, #ffffff 50%, #f1f5f9 75%);
    background-size: 600px 100%;
    animation: shimmer 1.6s infinite linear;
    border-radius: 4px;
  }
`;

const Sk = ({
  w, h, circle = false, pill = false, className = "", style = {},
}: {
  w: number | string; h: number; circle?: boolean; pill?: boolean;
  className?: string; style?: React.CSSProperties;
}) => (
  <div
    className={`sk ${className}`}
    style={{
      width: w,
      height: h,
      borderRadius: circle ? "50%" : pill ? 999 : 4,
      flexShrink: 0,
      ...style,
    }}
  />
);

const SectionSkeleton = ({ withRows = true }: { withRows?: boolean }) => (
  <div className="border border-gray-100 rounded-md overflow-hidden">
    {/* Section header */}
    <div className="px-3 py-2 flex justify-between items-center bg-gray-50">
      <div className="flex items-center gap-2.5">
        <Sk w={24} h={24} style={{ borderRadius: 4 }} />
        <div className="flex flex-col gap-1.5">
          <Sk w={80} h={11} />
          <Sk w={140} h={9} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1 items-end">
          <Sk w={36} h={9} />
          <Sk w={52} h={12} />
        </div>
        <Sk w={36} h={20} pill />
        <Sk w={28} h={26} style={{ borderRadius: 4 }} />
        <Sk w={14} h={14} style={{ borderRadius: 2 }} />
      </div>
    </div>

    {/* Table rows */}
    {withRows && (
      <div className="border-t border-gray-100">
        {/* thead */}
        <div className="grid gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100"
          style={{ gridTemplateColumns: "40px 1fr 64px 80px 68px 64px" }}>
          <Sk w={16} h={9} />
          <Sk w={70} h={9} />
          <Sk w={36} h={9} style={{ margin: "0 auto" }} />
          <Sk w={32} h={9} style={{ margin: "0 auto" }} />
          <Sk w={38} h={9} style={{ margin: "0 auto" }} />
          <div />
        </div>
        {[85, 70, 60].map((qw, i) => (
          <div
            key={i}
            className="grid gap-2 px-4 py-2.5 border-b border-gray-50 items-center"
            style={{ gridTemplateColumns: "40px 1fr 64px 80px 68px 64px" }}
          >
            <Sk w={20} h={20} circle />
            <div className="flex flex-col gap-1.5">
              <Sk w={`${qw}%`} h={11} />
              {i !== 1 && <Sk w={`${qw - 25}%`} h={9} />}
            </div>
            <Sk w={24} h={11} style={{ margin: "0 auto" }} />
            <Sk w={56} h={18} pill style={{ margin: "0 auto" }} />
            <Sk w={44} h={18} pill style={{ margin: "0 auto" }} />
            <div className="flex gap-1.5 justify-end">
              <Sk w={24} h={24} style={{ borderRadius: 4 }} />
              <Sk w={24} h={24} style={{ borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const PaperCardSkeleton = ({ expanded = false }: { expanded?: boolean }) => (
  <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
    {/* Paper header */}
    <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          <Sk w={24} h={24} circle />
          <div className="flex flex-col gap-1.5 flex-1">
            <Sk w="55%" h={13} style={{ maxWidth: 280 }} />
            <Sk w="25%" h={10} style={{ maxWidth: 120 }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Sk w={56} h={20} pill />
          <Sk w={56} h={20} pill />
          <Sk w={50} h={20} pill />
          <Sk w={64} h={20} pill />
          <Sk w={100} h={28} style={{ borderRadius: 6 }} />
        </div>
      </div>
    </div>

    {/* Sections */}
    {expanded && (
      <div className="p-2.5 flex flex-col gap-2.5">
        <SectionSkeleton withRows />
        <SectionSkeleton withRows={false} />
      </div>
    )}
  </div>
);

export const QuestionTableSkeleton = () => (
  <>
    <style>{shimmerClass}</style>
    <div className="space-y-3">
      <PaperCardSkeleton expanded />
      <PaperCardSkeleton />
      <PaperCardSkeleton />
    </div>
  </>
);