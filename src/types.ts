export interface Opts {
    host: string
    port: string
    prefix: string
    interval: string
}

export interface MeasurementsXML {
    root: Root
}

interface Root {
    Device: [Device]
}

interface Device {
    $: {
        Name: string
        Type: string
        Platform: string
        HmiPlatform: string
        NominalPower: string
        UserPowerLimit: string
        CountryPowerLimit: string
        Serial: string
        OEMSerial: string
        BusAddress: string
        NetBiosName: string
        WebPortal: string
        ManufacturerURL: string
        IpAddress: string
        DateTime: string
    }
    Measurements: [Measurements]
}

interface Measurements {
    Measurement: Measurement[]
}

interface Measurement {
    $: {
        Value?: string
        Unit: string
        Type: string
    }
}