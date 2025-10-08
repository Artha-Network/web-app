import React from "react";
import { FormField as RHFField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  control: any;
}

export const FormField: React.FC<FormFieldProps> = ({ name, label, placeholder, type = "text", control }) => (
  <RHFField
    control={control}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input type={type} placeholder={placeholder} {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export default FormField;

