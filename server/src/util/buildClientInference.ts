import { ragService } from "../services/ragService.js";
import { InferenceDetail, Invoice } from "../types.js";

type InvoiceClient = Invoice["client"];
type ClientMatch = ReturnType<typeof ragService.matchClient>;

export const buildClientInference = (
  client: InvoiceClient,
  clientSource: ClientMatch["source"],
): InferenceDetail => {
  if (clientSource === "rag_client") {
    return {
      field: "client",
      label: "Client Details",
      value: `${client.companyName} (${client.taxId || "Tax ID verified"})`,
      source: "rag_client",
      explanation: `Matched '${client.companyName}' from Customer Directory with registered GSTIN and address.`,
    };
  }

  if (clientSource === "explicit_prompt") {
    return {
      field: "client",
      label: "Client Details",
      value: client.companyName,
      source: "explicit_prompt",
      explanation: `Extracted '${client.companyName}' from prompt; created new draft client record.`,
    };
  }

  return {
    field: "client",
    label: "Client Details",
    value: `${client.companyName} (Default)`,
    source: "default_inferred",
    explanation: `Client was not mentioned in the prompt; defaulted to primary account '${client.companyName}'.`,
  };
};