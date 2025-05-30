declare module 'africastalking' {
  export class AfricasTalking {
    constructor(config: {
      apiKey: string;
      username: string;
    });

    SMS: {
      send(options: {
        to: string;
        message: string;
        from?: string;
      }): Promise<any>;
    };

    WhatsApp: {
      send(options: {
        to: string;
        message: {
          type: string;
          template: {
            name: string;
            language: {
              code: string;
            };
            components: Array<{
              type: string;
              parameters?: Array<{
                type: string;
                text: string;
              }>;
              sub_type?: string;
              index?: number;
            }>;
          };
        };
      }): Promise<any>;
    };
  }
} 