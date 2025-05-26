"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    showIcon?: boolean
}

const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
    ({ className, label, showIcon = true, ...props }, ref) => {
        return (
            <div className="grid gap-2">
                {label && <Label htmlFor={props.id}>{label}</Label>}
                <div className="relative">
                    {showIcon && (
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input
                        type="time"
                        className={cn(
                            showIcon && "pl-8",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
            </div>
        )
    }
)

TimePicker.displayName = "TimePicker"

export { TimePicker }
