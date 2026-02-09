import React from 'react';

export function Header() {
  return (
    <header className="absolute top-0 left-0 w-full p-8 flex flex-col md:flex-row justify-between items-start md:items-center z-10 pointer-events-none">
      <div className="text-xs md:text-sm text-gray-600 font-light pointer-events-auto">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="font-bold text-gray-900">DIRECTOR</span>
          <span>노무법인 호연 대표노무사 곽영준 KWAK YOUNG JUN</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="font-bold text-gray-900 invisible">DIRECTOR</span>
          <span className="text-xs text-gray-500">서울대학교, 현대자동차 인사담당자 출신 공인노무사</span>
        </div>
      </div>
    </header>
  );
}
