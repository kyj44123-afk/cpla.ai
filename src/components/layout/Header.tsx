import React from 'react';

export function Header() {
  return (
    <header className="w-full p-4 md:p-8 flex flex-col gap-1 z-10">
      <div className="text-xs md:text-sm text-gray-600 font-light">
        <div className="flex flex-wrap items-center gap-1 md:gap-3">
          <span className="font-bold text-gray-900">DIRECTOR</span>
          <span className="hidden md:inline">노무법인 호연 대표노무사 곽영준 KWAK YOUNG JUN</span>
          <span className="md:hidden">노무법인 호연 대표노무사 곽영준</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5 md:mt-1 md:pl-[72px]">
          서울대학교, 현대자동차 인사담당자 출신 공인노무사
        </div>
      </div>
    </header>
  );
}

