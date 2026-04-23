import { DayPicker } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = false, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn('p-3 w-full', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2 w-full',
        month: 'flex flex-col gap-4 w-full',
        month_caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-start',
        button_previous: cn(
          'absolute left-1 top-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 cursor-pointer',
          'flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-100 transition-colors',
        ),
        button_next: cn(
          'absolute right-1 top-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 cursor-pointer',
          'flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-100 transition-colors',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex w-full',
        weekday:
          'text-slate-500 rounded-md flex-1 min-w-0 font-normal text-[0.8rem] text-center flex items-center justify-center',
        week: 'flex w-full mt-2',
        day: cn(
          'relative p-0 text-center text-sm flex flex-1 min-w-0 items-center justify-center focus-within:relative focus-within:z-20',
          '[&:has([aria-selected])]:bg-slate-100',
          '[&:has([aria-selected].day-outside)]:bg-slate-100/50',
          '[&:has([aria-selected].day-range-end)]:rounded-r-md',
        ),
        day_button: cn(
          'h-8 w-8 p-0 font-normal rounded-md cursor-pointer',
          'flex items-center justify-center',
          'hover:bg-slate-100 hover:text-slate-900 transition-colors',
          'focus:bg-slate-100 focus:outline-none',
          'aria-selected:opacity-100',
        ),
        range_start: 'day-range-start',
        range_end: 'day-range-end',
        selected:
          '[&>button]:bg-blue-600 [&>button]:text-white [&>button]:hover:bg-blue-600 [&>button]:hover:text-white [&>button]:focus:bg-blue-600 [&>button]:rounded-md',
        today: '[&>button]:border [&>button]:border-blue-600 [&>button]:font-semibold',
        outside:
          'day-outside text-slate-400 aria-selected:bg-slate-100/50 aria-selected:text-slate-400',
        disabled: 'text-slate-400 opacity-50',
        range_middle:
          'aria-selected:bg-slate-100 aria-selected:text-slate-900',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
