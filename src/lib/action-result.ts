export type ActionResult<T = void> =
  | {
      success: true;
      message?: string;
      data?: T;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
