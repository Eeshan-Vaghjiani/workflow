declare module '@rsagiev/gantt-task-react-19' {
    export interface Task {
        id: string;
        name: string;
        start: Date;
        end: Date;
        progress: number;
        type: string;
        hideChildren?: boolean;
        displayOrder?: number;
        project?: string;
        dependencies?: string[];
        styles?: {
            backgroundColor?: string;
            backgroundSelectedColor?: string;
            progressColor?: string;
            progressSelectedColor?: string;
        };
    }

    export enum ViewMode {
        Hour = "Hour",
        QuarterDay = "Quarter Day",
        HalfDay = "Half Day",
        Day = "Day",
        Week = "Week",
        Month = "Month",
        Year = "Year"
    }

    export interface GanttProps {
        tasks: Task[];
        viewMode?: ViewMode;
        onSelect?: (task: Task) => void;
        listCellWidth?: string;
        columnWidth?: number;
        rowHeight?: number;
        barCornerRadius?: number;
        TooltipContent?: React.FC<{ task: Task }> | null;
        arrowColor?: string;
    }

    export const Gantt: React.FC<GanttProps>;
} 