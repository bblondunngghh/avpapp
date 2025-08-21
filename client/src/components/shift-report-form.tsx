hTurnIn < 0 ? 
                              hoursPercent * Math.abs(expectedCompanyCashTurnIn) : 0;
                              
                            // Calculate total earnings
                            const totalEarnings = employeeCommission + employeeTips;
                            
                            let employeeName = "Employee";
                            if (employee.name) {
                              // First try to find the employee by key in the employees data
                              const foundEmployee = employees?.find((emp: any) => 
                                emp.key?.toLowerCase() === employee.name.toLowerCase()
                              );
                              
                              if (foundEmployee) {
                                employeeName = foundEmployee.fullName || foundEmployee.key;
                              } else {
                                // Fallback to hardcoded mapping for legacy employees
                                const nameMap: Record<string, string> = {
                                  "antonio": "Antonio Martinez",
                                  "arturo": "Arturo Sanchez",
                                  "brandon": "Brandon Blond",
                                  "brett": "Brett Willson",
                                  "dave": "Dave Roehm",
                                  "devin": "Devin Bean",
                                  "dylan": "Dylan McMullen",
                                  "elijah": "Elijah Aguilar",
                                  "ethan": "Ethan Walker",
                                  "gabe": "Gabe Ott",
                                  "jacob": "Jacob Weldon",
                                  "joe": "Joe Albright",
                                  "jonathan": "Jonathan Zaccheo",
                                  "kevin": "Kevin Hanrahan",
                                  "melvin": "Melvin Lobos",
                                  "noe": "Noe Coronado",
                                  "riley": "Riley McIntyre",
                                  "ryan": "Ryan Hocevar",
                                  "zane": "Zane Springer"
                                };
                                employeeName = nameMap[employee.name] || employee.name || `Employee ${index+1}`;
                              }
                            }
                            
                            return (
                              <div key={index} className="border border-gray-100 rounded-md p-3 bg-gray-50">
                                <div className="flex justify-between mb-2 pb-1 border-b border-gray-200">
                                  <div className="font-medium text-sm text-sky-700">{employeeName}</div>
                                  <div className="text-xs text-gray-600">{employee.hours} hours ({(hoursPercent * 100).toFixed(1)}%)</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Commission:</span>
                                    <span>${employeeCommission.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Tips:</span>
                                    <span>${employeeTips.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Money Owed:</span>
                                    <span>${employeeMoneyOwed.toFixed(2)}</span>
                                  </div>
                                  <div className="col-span-2 flex justify-between text-xs font-medium border-t border-gray-200 pt-1 mt-1">
                                    <span>Total Earnings:</span>
                                    <span>${totalEarnings.toFixed(2)}</span>
                                  </div>


                                  
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Tax Policy Update Notice - Auto-remove after 30 days from July 2, 2025 */}
                        {(() => {
                          const noticeStartDate = new Date('2025-07-02'); // July 2, 2025
                          const currentDate = new Date();
                          const daysDifference = Math.floor((currentDate.getTime() - noticeStartDate.getTime()) / (1000 * 60 * 60 * 24));
                          
                          // Show notice only if less than 30 days have passed
                          if (daysDifference < 30) {
                            return (
                              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-blue-800">Tax Policy Update Notice</h4>
                                    <div className="text-xs text-blue-700">
                                      <p>
                                        After reviewing payroll data for the past few months, we have determined that the 22% tax payment is not expected to be required moving forward. However, please note that this could change if employees move into a higher tax bracket, potentially requiring us to reimplement the paid-in tax obligation. Any money owed will be contributed to your taxes and should cover your tax obligations, with any remaining balances redistributed back to you via direct deposit or check.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null; // Don't show notice after 30 days
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 py-4 text-center bg-white rounded-md border border-gray-200">
                    Enter Total Job Hours above to begin distributing commission and tips to employees.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold flex items-center gap-2">
              <img src={notesTasksIcon} alt="Notes Tasks" className="w-4 h-4" />
              SHIFT NOTES
            </h3>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Shift Notes</FormLabel>
                    <FormControl>
                      <Textarea className="paperform-input h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-6 border-t border-gray-200 pt-4">
                <FormField
                  control={form.control}
                  name="confirmationCheck"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-blue-50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          By checking this box, I confirm the numbers above to be correct to the best of my knowledge.
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          
          <div className="py-8 flex justify-center">
            <Button type="submit" disabled={isSubmitting} className="w-full max-w-md py-6 text-lg shadow-lg">
              {isSubmitting ? (
                <>
                  <span className="mr-2">Submitting...</span>
                  <span className="animate-spin">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10" />
                    </svg>
                  </span>
                </>
              ) : (
                <>
                  <span>{reportId ? "Update Report" : "Submit Report"}</span>
                  <img src={sendEmailIcon} alt="Send Email" className="ml-3 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}