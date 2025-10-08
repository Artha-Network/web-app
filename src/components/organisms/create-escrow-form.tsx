import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import type { EscrowInit, EscrowInitFormValues } from "@/types/escrow";
import { isValidSolanaAddress } from "@/utils/solana";

/**
 * CreateEscrowForm (Organism)
 *
 * UI-only form for initiating an escrow draft. Emits structured values
 * to parent via `onSubmit`. No backend or transaction logic is present.
 */
export interface CreateEscrowFormProps {
  defaultValues?: Partial<EscrowInitFormValues>;
  onSubmit?: (values: EscrowInit) => Promise<void> | void;
}

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  currency: z.literal("USDC"),
  counterpartyAddress: z
    .string()
    .refine((v) => isValidSolanaAddress(v), { message: "Invalid Solana address" }),
  feeBps: z
    .number({ invalid_type_error: "Fee is required" })
    .min(0, "Fee must be >= 0 bps")
    .max(10000, "Fee must be <= 10000 bps"),
  dueDate: z.date().nullable(),
  description: z.string().max(2000, "Description is too long").optional(),
});

export const CreateEscrowForm: React.FC<CreateEscrowFormProps> = ({ defaultValues, onSubmit }) => {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      amount: 0,
      currency: "USDC",
      counterpartyAddress: "",
      feeBps: 0,
      dueDate: null,
      description: "",
      ...defaultValues,
    },
    mode: "onChange",
  });

  const handleSubmit = (values: z.infer<typeof schema>) => {
    const dueDateUnix = values.dueDate ? Math.floor(values.dueDate.getTime() / 1000) : null;
    const payload: EscrowInit = {
      title: values.title,
      amount: values.amount,
      currency: values.currency,
      counterpartyAddress: values.counterpartyAddress,
      feeBps: values.feeBps,
      description: values.description,
      dueDateUnix,
    };
    onSubmit?.(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Escrow</CardTitle>
        <CardDescription>Define basic terms before funding on-chain.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Short summary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={Number.isNaN(field.value as unknown as number) ? 0 : field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Amount in token units (e.g., 1.25 USDC).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <Label>Currency</Label>
              <Input value="USDC" disabled readOnly />
            </div>

            <FormField
              control={form.control}
              name="counterpartyAddress"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Counterparty Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Recipient Solana address (base58)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feeBps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee (bps)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={10000}
                      value={Number.isNaN(field.value as unknown as number) ? 0 : field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value || "0", 10))}
                    />
                  </FormControl>
                  <FormDescription>100 bps = 1%. Max 10000.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ""}
                      onChange={(e) => {
                        const v = e.target.value ? new Date(e.target.value) : null;
                        field.onChange(v);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Optional delivery deadline.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Describe the deal terms" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2 flex gap-3">
              <Button type="submit">Create Draft</Button>
              <Button type="button" variant="outline" onClick={() => form.reset()}>Reset</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateEscrowForm;

