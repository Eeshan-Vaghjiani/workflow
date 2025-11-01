import * as React from "react"
import { format } from "date-fns"
import ReactDatePicker, { ReactDatePickerProps } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface DatePickerProps extends Omit<ReactDatePickerProps, "onChange"> {
  value?: Date
  onChange?: (date: Date | null) => void
  selected?: Date
  onSelect?: (date: Date | null) => void
  className?: string
}

export function DatePicker({
  value,
  onChange,
  selected,
  onSelect,
  className,
  ...props
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | null>((value || selected) || null)

  React.useEffect(() => {
    if (value) {
      setDate(value)
    } else if (selected) {
      setDate(selected)
    }
  }, [value, selected])

  const handleChange = (date: Date | null) => {
    setDate(date)
    if (onChange) {
      onChange(date)
    }
    if (onSelect) {
      onSelect(date)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <ReactDatePicker
        selected={date}
        onChange={handleChange}
        dateFormat="PPP"
        className="w-full rounded-md border border-neutral-200 bg-transparent py-2 pl-3 pr-10 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
        customInput={
          <Button variant="outline" className="w-full justify-start text-left">
            {date ? format(date, "PPP") : "Select date"}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        }
        {...props}
      />
    </div>
  )
} 