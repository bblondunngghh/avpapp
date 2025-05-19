import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the props for the component
interface EmployeeHoursDistributionProps {
  form: UseFormReturn<any>;
  totalCommission: number;
  totalTips: number;
  moneyOwed: number;
}

export default function EmployeeHoursDistribution({
  form,
  totalCommission,
  totalTips,
  moneyOwed
}: EmployeeHoursDistributionProps) {
  const totalJobHours = Number(form.watch("totalJobHours") || 0);
  const employees = form.watch("employees") || [];
  
  // Add an employee to the form
  const addEmployee = () => {
    const currentEmployees = form.getValues("employees") || [];
    form.setValue("employees", [
      ...currentEmployees,
      { name: "", hours: 0 }
    ]);
  };
  
  // Remove the last employee from the form
  const removeLastEmployee = () => {
    const currentEmployees = [...(form.getValues("employees") || [])];
    currentEmployees.pop();
    form.setValue("employees", currentEmployees);
  };
  
  // If there are no employees yet, show a prompt
  if (totalJobHours === 0) {
    return (
      <div className="text-sm text-gray-600">
        Enter Total Job Hours above to begin distributing commission and tips to employees.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header row showing column titles */}
      <div className="grid grid-cols-6 gap-2 font-medium text-sm pb-2 text-center">
        <div className="text-left">Employee</div>
        <div>Hours</div>
        <div>% of Total</div>
        <div>Commission</div>
        <div>Tips</div>
        <div>Money Owed</div>
      </div>
      
      {/* Employee rows */}
      {employees.map((employee: any, index: number) => {
        const hoursPercent = totalJobHours > 0 ? employee.hours / totalJobHours : 0;
        const commission = hoursPercent * totalCommission;
        const tips = hoursPercent * totalTips;
        const employeeTotal = commission + tips;
        const taxes = employeeTotal * 0.22; // 22% tax
        const moneyOwedToEmployee = hoursPercent * moneyOwed;
        const cashTurnIn = taxes > moneyOwedToEmployee ? taxes - moneyOwedToEmployee : 0;
        
        return (
          <div key={index} className="employee-row">
            {/* Employee name selection */}
            <div className="employee-name">
              <FormItem>
                <Select 
                  onValueChange={(value) => {
                    const updatedEmployees = [...form.getValues("employees")];
                    updatedEmployees[index].name = value;
                    form.setValue("employees", updatedEmployees);
                  }}
                  value={employee.name}
                >
                  <FormControl>
                    <SelectTrigger className="h-[42px]">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="john">John Doe</SelectItem>
                    <SelectItem value="jane">Jane Smith</SelectItem>
                    <SelectItem value="bob">Bob Johnson</SelectItem>
                    <SelectItem value="sarah">Sarah Williams</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            </div>
            
            {/* Hours input */}
            <div className="employee-hours">
              <FormItem>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.5" 
                    className="h-[42px]" 
                    value={employee.hours}
                    onChange={(e) => {
                      const updatedEmployees = [...form.getValues("employees")];
                      updatedEmployees[index].hours = parseFloat(e.target.value) || 0;
                      form.setValue("employees", updatedEmployees);
                    }}
                  />
                </FormControl>
              </FormItem>
            </div>
            
            {/* Financial calculations */}
            <div className="hours-percent">{(hoursPercent * 100).toFixed(1)}%</div>
            <div className="commission-amount">${commission.toFixed(2)}</div>
            <div className="tips-amount">${tips.toFixed(2)}</div>
            <div className="money-owed">${moneyOwedToEmployee.toFixed(2)}</div>
            <div className="total-earnings">Total: ${employeeTotal.toFixed(2)}</div>
            <div className="tax-amount">Tax: ${taxes.toFixed(2)}</div>
            <div className="cash-turnin">Turn-in: ${cashTurnIn.toFixed(2)}</div>
          </div>
        );
      })}
      
      {/* Add/Remove employee buttons */}
      <div className="flex justify-between mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEmployee}
        >
          Add Employee
        </Button>
        
        {employees.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeLastEmployee}
          >
            Remove Last
          </Button>
        )}
      </div>
    </div>
  );
}