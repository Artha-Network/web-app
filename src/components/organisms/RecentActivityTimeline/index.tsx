import { FC, ReactNode } from "react";

export interface ActivityItem {
  readonly id: string;
  readonly icon: ReactNode;
  readonly title: string;
  readonly date: string;
  readonly colorClass?: string; // e.g., text-green-600
}

export interface RecentActivityTimelineProps {
  readonly items: ReadonlyArray<ActivityItem>;
}

/**
 * RecentActivityTimeline
 * Two-column grid with a vertical timeline indicator and activity content.
 */
export const RecentActivityTimeline: FC<RecentActivityTimelineProps> = ({ items }) => {
  // Render as alternating blocks with connectors similar to the HTML.
  return (
    <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
      {items.map((it, idx) => (
        <div key={it.id} className="contents">
          <div
            className={"flex flex-col items-center gap-1 " + (idx === 0 ? "pt-3" : "") + (idx === items.length - 1 ? " pb-3" : "")}
          >
            {idx > 0 && <div className="w-[1.5px] bg-gray-200 h-2" />}
            <div className={it.colorClass ?? "text-blue-600"} aria-hidden>
              <div className="text-3xl">{it.icon}</div>
            </div>
            {idx < items.length - 1 && <div className="w-[1.5px] bg-gray-200 h-2 grow" />}
          </div>
          <div className="flex flex-1 flex-col py-3">
            <p className="text-gray-900 text-base font-medium leading-normal">{it.title}</p>
            <p className="text-gray-600 text-base font-normal leading-normal">{it.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivityTimeline;

