declare module 'react-native-thermal-receipt-printer' {
  export interface PrinterOptions {
    beep?: boolean;
    cut?: boolean;
    tailingLine?: boolean;
    encoding?: string;
  }

  export interface PrinterDevice {
    device_name: string;
    inner_mac_address: string;
    host?: string;
    port?: number;
    vendor_id?: string;
    product_id?: string;
  }

  export interface BluetoothPrinter {
    init: () => Promise<void>;
    getDeviceList: () => Promise<PrinterDevice[]>;
    connectPrinter: (
      address: string,
      autoConnect?: boolean
    ) => Promise<PrinterDevice>;
    closeConn: () => Promise<void>;
    printText: (text: string, options?: PrinterOptions) => Promise<string>;
    printBill: (text: string, options?: PrinterOptions) => Promise<string>;
    printImageBase64: (
      base64: string,
      options?: PrinterOptions
    ) => Promise<string>;
    printLeftRight: (
      left: string,
      right: string,
      options?: PrinterOptions
    ) => Promise<string>;
    printColumn: (
      columnWidths: number[],
      columnAlignments: string[],
      columnTexts: string[],
      options?: PrinterOptions
    ) => Promise<string>;
    printPic: (
      base64: string,
      options?: PrinterOptions
    ) => Promise<string>;
  }

  export interface USBPrinter {
    init: () => Promise<void>;
    getDeviceList: () => Promise<PrinterDevice[]>;
    connectPrinter: (
      vendorId: string,
      productId: string
    ) => Promise<PrinterDevice>;
    closeConn: () => Promise<void>;
    printText: (text: string, options?: PrinterOptions) => Promise<string>;
    printBill: (text: string, options?: PrinterOptions) => Promise<string>;
    printImageBase64: (
      base64: string,
      options?: PrinterOptions
    ) => Promise<string>;
    printLeftRight: (
      left: string,
      right: string,
      options?: PrinterOptions
    ) => Promise<string>;
    printColumn: (
      columnWidths: number[],
      columnAlignments: string[],
      columnTexts: string[],
      options?: PrinterOptions
    ) => Promise<string>;
  }

  export interface NetPrinter {
    init: () => Promise<void>;
    getDeviceList: () => Promise<PrinterDevice[]>;
    connectPrinter: (host: string, port: number) => Promise<PrinterDevice>;
    closeConn: () => Promise<void>;
    printText: (text: string, options?: PrinterOptions) => Promise<string>;
    printBill: (text: string, options?: PrinterOptions) => Promise<string>;
    printImageBase64: (
      base64: string,
      options?: PrinterOptions
    ) => Promise<string>;
    printLeftRight: (
      left: string,
      right: string,
      options?: PrinterOptions
    ) => Promise<string>;
    printColumn: (
      columnWidths: number[],
      columnAlignments: string[],
      columnTexts: string[],
      options?: PrinterOptions
    ) => Promise<string>;
  }

  export const BluetoothPrinter: BluetoothPrinter;
  export const USBPrinter: USBPrinter;
  export const NetPrinter: NetPrinter;
} 