"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { th } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
}

export function DateTimePicker({
  date,
  setDate,
  className,
}: DateTimePickerProps) {
  const [selectedTime, setSelectedTime] = React.useState<string>(
    date ? format(date, "HH:mm") : ""
  )

  // Update the time when the date changes
  React.useEffect(() => {
    if (date) {
      setSelectedTime(format(date, "HH:mm"))
    }
  }, [date])

  const handleTimeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedTime(e.target.value)

      if (date && e.target.value) {
        const [hours, minutes] = e.target.value.split(":")
        const newDate = new Date(date)
        newDate.setHours(parseInt(hours, 10))
        newDate.setMinutes(parseInt(minutes, 10))
        setDate(newDate)
      }
    },
    [date, setDate]
  )

  const handleDateSelect = React.useCallback(
    (selectedDate: Date | undefined) => {
      if (selectedDate) {
        const newDate = new Date(selectedDate)
        
        if (selectedTime) {
          const [hours, minutes] = selectedTime.split(":")
          newDate.setHours(parseInt(hours, 10))
          newDate.setMinutes(parseInt(minutes, 10))
        } else {
          // If no time was previously selected, default to current time
          const now = new Date()
          newDate.setHours(now.getHours())
          newDate.setMinutes(now.getMinutes())
          setSelectedTime(format(newDate, "HH:mm"))
        }
        
        setDate(newDate)
      } else {
        setDate(undefined)
      }
    },
    [selectedTime, setDate]
  )

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, "PPP HH:mm", { locale: th })
            ) : (
              <span>เลือกวันที่และเวลา</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            locale={th}
          />
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className="w-full"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}