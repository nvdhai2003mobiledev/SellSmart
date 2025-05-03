declare module 'react-native-bluetooth-escpos-printer' {
  interface PrinterOptions {
    encoding?: string;
    codepage?: number;
    widthtimes?: number;
    heigthtimes?: number;
    fonttype?: number;
  }

  interface ColumnOptions extends PrinterOptions {
    align?: number;
  }

  interface BluetoothEscposPrinter {
    ALIGN: {
      LEFT: number;
      CENTER: number;
      RIGHT: number;
    };

    printerInit(): Promise<string>;
    printerLeftSpace(space: number): Promise<string>;
    printerAlign(align: number): Promise<string>;
    setBlob(blob: number): Promise<string>;
    printText(text: string, options?: PrinterOptions): Promise<string>;
    printColumn(
      widths: number[],
      aligns: number[],
      texts: string[],
      options?: ColumnOptions
    ): Promise<string>;
    printPic(base64: string, options?: PrinterOptions): Promise<string>;
    selfTest(): Promise<string>;
    cutOnePoint(): Promise<string>;
    cutFull(): Promise<string>;
    connectPrinter(address: string, name?: string): Promise<boolean>;
    disconnect(): Promise<boolean>;
    isConnected(): Promise<boolean>;
  }

  const BluetoothManager: {
    isBluetoothEnabled(): Promise<boolean>;
    enableBluetooth(): Promise<boolean>;
    disableBluetooth(): Promise<boolean>;
    scanDevices(): Promise<Array<{
      name: string;
      address: string;
    }>>;
    connect(address: string): Promise<boolean>;
    disconnect(): Promise<boolean>;
  };

  const BluetoothTscPrinter: {
    printLabel(options: any): Promise<string>;
  };

  const instance: BluetoothEscposPrinter;
  export default instance;
  export { BluetoothManager, BluetoothTscPrinter };
} 