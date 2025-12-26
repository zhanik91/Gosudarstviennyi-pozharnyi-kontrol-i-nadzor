import React, { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Plus, Trash2, Copy, ClipboardPaste } from "lucide-react";

interface ExcelCell {
  value: string;
  type?: 'text' | 'number' | 'date';
  formula?: string;
  readonly?: boolean;
}

interface ExcelRow {
  [key: string]: ExcelCell;
}

interface ExcelStyleTableProps {
  columns: Array<{
    key: string;
    title: string;
    width?: number;
    type?: 'text' | 'number' | 'date';
  }>;
  data: ExcelRow[];
  onDataChange?: (data: ExcelRow[]) => void;
  readOnly?: boolean;
}

export default function ExcelStyleTable({ 
  columns, 
  data, 
  onDataChange, 
  readOnly = false 
}: ExcelStyleTableProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  const handleCellClick = (rowIndex: number, colKey: string) => {
    if (readOnly) return;
    
    setSelectedCell({ row: rowIndex, col: colKey });
    setEditingCell(null);
  };

  const handleCellDoubleClick = (rowIndex: number, colKey: string) => {
    if (readOnly || data[rowIndex]?.[colKey]?.readonly) return;
    
    setEditingCell({ row: rowIndex, col: colKey });
    setEditValue(data[rowIndex]?.[colKey]?.value || "");
  };

  const handleCellEdit = (rowIndex: number, colKey: string, value: string) => {
    if (!onDataChange) return;
    
    const newData = [...data];
    if (!newData[rowIndex]) {
      newData[rowIndex] = {};
    }
    
    newData[rowIndex][colKey] = {
      ...newData[rowIndex][colKey],
      value,
    };
    
    onDataChange(newData);
    setEditingCell(null);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell || readOnly) return;
    
    const { row, col } = selectedCell;
    
    switch (e.key) {
      case 'Enter':
        if (editingCell) {
          handleCellEdit(editingCell.row, editingCell.col, editValue);
        } else {
          handleCellDoubleClick(row, col);
        }
        break;
      case 'Escape':
        setEditingCell(null);
        break;
      case 'Delete':
        if (!editingCell) {
          handleCellEdit(row, col, "");
        }
        break;
      case 'ArrowUp':
        if (row > 0) {
          setSelectedCell({ row: row - 1, col });
        }
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (row < data.length - 1) {
          setSelectedCell({ row: row + 1, col });
        }
        e.preventDefault();
        break;
      case 'ArrowLeft':
        const currentColIndex = columns.findIndex(c => c.key === col);
        if (currentColIndex > 0) {
          setSelectedCell({ row, col: columns[currentColIndex - 1].key });
        }
        e.preventDefault();
        break;
      case 'ArrowRight':
        const nextColIndex = columns.findIndex(c => c.key === col);
        if (nextColIndex < columns.length - 1) {
          setSelectedCell({ row, col: columns[nextColIndex + 1].key });
        }
        e.preventDefault();
        break;
    }
  }, [selectedCell, editingCell, editValue, columns, data.length, readOnly]);

  React.useEffect(() => {
    const listener = (e: any) => handleKeyDown(e);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [handleKeyDown]);

  const addRow = () => {
    if (!onDataChange || readOnly) return;
    
    const newData = [...data, {}];
    onDataChange(newData);
  };

  const deleteSelectedRows = () => {
    if (!onDataChange || readOnly || selectedRows.length === 0) return;
    
    const newData = data.filter((_, index) => !selectedRows.includes(index));
    onDataChange(newData);
    setSelectedRows([]);
  };

  const toggleRowSelection = (rowIndex: number) => {
    if (selectedRows.includes(rowIndex)) {
      setSelectedRows(selectedRows.filter(i => i !== rowIndex));
    } else {
      setSelectedRows([...selectedRows, rowIndex]);
    }
  };

  const selectAllRows = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((_, index) => index));
    }
  };

  const formatCellValue = (cell: ExcelCell | undefined, type: string = 'text') => {
    if (!cell?.value) return "";
    
    switch (type) {
      case 'number':
        const num = parseFloat(cell.value);
        return isNaN(num) ? cell.value : num.toLocaleString();
      case 'date':
        try {
          return new Date(cell.value).toLocaleDateString();
        } catch {
          return cell.value;
        }
      default:
        return cell.value;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {/* Панель инструментов */}
        {!readOnly && (
          <div className="border-b p-3 flex items-center gap-2 bg-muted/50">
            <Button size="sm" onClick={addRow} data-testid="button-add-row">
              <Plus className="w-4 h-4 mr-1" />
              Добавить строку
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={deleteSelectedRows}
              disabled={selectedRows.length === 0}
              data-testid="button-delete-rows"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Удалить ({selectedRows.length})
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="outline" data-testid="button-copy">
              <Copy className="w-4 h-4 mr-1" />
              Копировать
            </Button>
            <Button size="sm" variant="outline" data-testid="button-paste">
              <ClipboardPaste className="w-4 h-4 mr-1" />
              Вставить
            </Button>
            <Button size="sm" data-testid="button-save">
              <Save className="w-4 h-4 mr-1" />
              Сохранить
            </Button>
          </div>
        )}

        {/* Таблица */}
        <div 
          ref={tableRef}
          className="overflow-auto max-h-96 border-collapse"
          style={{ maxWidth: '100%' }}
        >
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-muted z-10">
              <tr>
                <th className="w-12 p-2 border border-border bg-muted text-center">
                  <Checkbox
                    checked={selectedRows.length === data.length && data.length > 0}
                    onCheckedChange={selectAllRows}
                    data-testid="checkbox-select-all-rows"
                  />
                </th>
                <th className="w-12 p-2 border border-border bg-muted text-center font-mono text-xs">
                  №
                </th>
                {columns.map((col) => (
                  <th 
                    key={col.key}
                    className="p-2 border border-border bg-muted text-left font-medium"
                    style={{ width: col.width || 120 }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + 2} 
                    className="p-8 text-center text-muted-foreground border border-border"
                  >
                    Нет данных. Нажмите "Добавить строку" для начала работы.
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex}
                    className={selectedRows.includes(rowIndex) ? 'bg-primary/10' : 'hover:bg-muted/30'}
                  >
                    <td className="p-1 border border-border text-center">
                      <Checkbox
                        checked={selectedRows.includes(rowIndex)}
                        onCheckedChange={() => toggleRowSelection(rowIndex)}
                        data-testid={`checkbox-row-${rowIndex}`}
                      />
                    </td>
                    <td className="p-2 border border-border text-center font-mono text-xs bg-muted/50">
                      {rowIndex + 1}
                    </td>
                    {columns.map((col) => {
                      const cell = row[col.key];
                      const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === col.key;
                      const isEditing = editingCell?.row === rowIndex && editingCell?.col === col.key;
                      const isReadOnly = readOnly || cell?.readonly;

                      return (
                        <td 
                          key={col.key}
                          className={`p-0 border border-border ${
                            isSelected ? 'ring-2 ring-primary ring-inset' : ''
                          } ${isReadOnly ? 'bg-muted/30' : 'bg-background'}`}
                          onClick={() => handleCellClick(rowIndex, col.key)}
                          onDoubleClick={() => handleCellDoubleClick(rowIndex, col.key)}
                          data-testid={`cell-${rowIndex}-${col.key}`}
                        >
                          {isEditing ? (
                            <Input
                              type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleCellEdit(rowIndex, col.key, editValue)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCellEdit(rowIndex, col.key, editValue);
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              className="border-0 rounded-none h-8 px-2 focus:ring-0"
                              autoFocus
                              data-testid={`input-${rowIndex}-${col.key}`}
                            />
                          ) : (
                            <div 
                              className={`h-8 px-2 flex items-center ${
                                col.type === 'number' ? 'justify-end font-mono' : 'justify-start'
                              }`}
                            >
                              {formatCellValue(cell, col.type)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Статусная строка */}
        <div className="border-t p-2 text-xs text-muted-foreground bg-muted/30 flex justify-between">
          <div>
            Строк: {data.length} | Выбрано: {selectedRows.length}
          </div>
          {selectedCell && (
            <div>
              Ячейка: {String.fromCharCode(65 + columns.findIndex(c => c.key === selectedCell.col))}{selectedCell.row + 1}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}