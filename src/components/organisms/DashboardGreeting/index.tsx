import { FC } from "react";

export interface DashboardGreetingProps {
  readonly name: string;
}

/**
 * DashboardGreeting
 * Displays the large welcome message.
 */
export const DashboardGreeting: FC<DashboardGreetingProps> = ({ name }) => {
  return (
    <div className="flex flex-wrap justify-between gap-3 p-4">
      <p className="text-gray-900 tracking-light text-[32px] font-bold leading-tight min-w-72">
        {`Welcome back, ${name}`}
      </p>
    </div>
  );
};

export default DashboardGreeting;

