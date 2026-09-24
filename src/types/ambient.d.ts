// Official @types/react and @types/node are installed in node_modules.
// Only ambient declarations for unbundled SDKs are maintained below.

// ─── @google/genai SDK Ambient Declaration ────────────────────────────────────
// Typed surface for the enterprise bot-takeover GenAI client.
// Covers interactions.create (standard + streaming), store flag, and previous_interaction_id.

declare module '@google/genai' {
  export interface InteractionUsage {
    readonly input_tokens: number;
    readonly output_tokens: number;
    readonly total_tokens: number;
  }

  export interface StreamDelta {
    readonly type: 'text' | 'audio' | 'image' | 'thought_summary' | 'thought_signature';
    readonly text?: string;
  }

  export interface StreamEvent {
    readonly event_type:
      | 'interaction.created'
      | 'interaction.status_update'
      | 'interaction.completed'
      | 'step.start'
      | 'step.delta'
      | 'step.stop';
    readonly delta?: StreamDelta;
    readonly interaction?: GenAIInteraction;
  }

  export type InteractionStatus =
    | 'completed'
    | 'in_progress'
    | 'requires_action'
    | 'failed'
    | 'cancelled';

  export interface GenAIInteraction {
    readonly id: string;
    readonly status: InteractionStatus;
    readonly output_text: string | null;
    readonly usage?: InteractionUsage;
    readonly error?: string;
  }

  export interface InteractionCreateOptions {
    readonly model?: string;
    readonly input: string;
    readonly system_instruction?: string;
    readonly previous_interaction_id?: string;
    readonly store?: boolean;
    readonly stream?: boolean;
  }

  export interface InteractionCreateStreamOptions extends InteractionCreateOptions {
    readonly stream: true;
  }

  export interface InteractionsClient {
    create(options: InteractionCreateOptions & { stream?: false }): Promise<GenAIInteraction>;
    create(options: InteractionCreateStreamOptions): AsyncIterable<StreamEvent>;
  }

  export interface GoogleGenAIOptions {
    readonly apiKey?: string;
  }

  export class GoogleGenAI {
    readonly interactions: InteractionsClient;
    constructor(options?: GoogleGenAIOptions);
  }
}
