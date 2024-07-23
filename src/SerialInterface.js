import { useState,useEffect } from "react";

const SerialInterface = () => {
    const [port, setPort] = useState(null);
    const [reader, setReader] = useState(null);
    const [sensorData, setSensorData] = useState({});
    let buffer = ''; // Initialize a buffer

    const connect = async () => {
        try {
            const newPort = await navigator.serial.requestPort();
            await newPort.open({ baudRate: 9600 });
            setPort(newPort);
            readData(newPort);
        } catch (error) {
            console.error('Error connecting to serial port:', error);
        }
    };

    const readData = async (port) => {
        const textDecoder = new TextDecoder();
        const readableStream = port.readable;

        const newReader = readableStream.getReader();
        setReader(newReader);

        const readLoop = async () => {
            try {
                while (true) {
                    const { done, value } = await newReader.read();
                    if (done) {
                        break;
                    }

                    // Decode the incoming chunk
                    const decodedValue = textDecoder.decode(value, { stream: true });
                    buffer += decodedValue; // Append to buffer

                    // Process buffer line by line
                    let endOfLineIndex;
                    while ((endOfLineIndex = buffer.indexOf('\n')) >= 0) {
                        const line = buffer.substring(0, endOfLineIndex); // Grab the complete line
                        buffer = buffer.substring(endOfLineIndex + 1); // Remove the processed line from buffer

                        // Parse the JSON object
                        try {
                            const data = JSON.parse(line);
                            setSensorData(data); // Update state with the sensor data
                        } catch (e) {
                            console.error('Error parsing JSON:', e);
                        }
                    }
                }
            } catch (error) {
                console.error('Error reading from serial port:', error);
            } finally {
                newReader.releaseLock();
                setReader(null);
            }
        };

        readLoop();
    };

    const disconnect = async () => {
        if (reader) {
            reader.releaseLock();
            setReader(null);
        }

        if (port) {
            await port.close();
            setPort(null);
        }
    };

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return (
        <div>
            <h1>Serial Interface</h1>
            <button onClick={connect}>Connect</button>
            <button onClick={disconnect}>Disconnect</button>
            <div>
                <h2>Sensor Values:</h2>
                <pre>{JSON.stringify(sensorData, null, 2)}</pre>
            </div>
        </div>
    );
};

export default SerialInterface;
