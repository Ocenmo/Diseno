package com.example.gpsrpmv;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

public class MainActivity extends AppCompatActivity {
    private static final UUID OBD2_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final String SPEED_PID = "010D";
    private static final String RPM_PID = "010C";
    private static final int MESSAGE_READ = 1;
    private static final int REQUEST_ENABLE_BT = 1;
    private static final int PERMISSION_REQUEST_CODE = 2;

    // UDP Configuration
    private List<InetAddress> targetIPs = new ArrayList<>();
    private static final int UDP_PORT = 4665; // Replace with your target port
    private DatagramSocket udpSocket;

    private Spinner carSelector;
    private String currentCar = "car1";

    private static final String[] REQUIRED_PERMISSIONS = {
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
    };

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket socket;
    private InputStream inputStream;
    private OutputStream outputStream;
    private boolean isConnected = false;

    private Button scanButton;
    private ListView listView;
    private TextView statusText;
    private TextView speedText;
    private TextView rpmText;

    private ArrayList<BluetoothDevice> devicesList;
    private ArrayAdapter<String> devicesAdapter;

    // Current values for JSON
    private int currentSpeed = 0;
    private int currentRPM = 0;

    // GPS
    private LocationManager locationManager;
    private LocationListener locationListener;
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 3;
    private static final String[] LOCATION_PERMISSIONS = {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
    };

    // Variables para almacenar datos de ubicación
    private double currentLatitude = 0.0;
    private double currentLongitude = 0.0;
    private long currentTimestamp = 0;

    private final Handler handler = new Handler(Looper.getMainLooper()) {
        @Override
        public void handleMessage(@NonNull Message msg) {
            if (msg.what == MESSAGE_READ) {
                String data = (String) msg.obj;
                if (data.contains("41 0D")) {
                    processSpeed(data);
                } else if (data.contains("41 0C")) {
                    processRPM(data);
                }
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize default values
        currentSpeed = 0;
        currentRPM = 0;
        currentLatitude = 0.0;
        currentLongitude = 0.0;
        currentTimestamp = System.currentTimeMillis();

        initializeViews();
        initializeCarSelector();
        initializeBluetooth();
        initializeGPS();
        initializeUDP();

        scanButton.setOnClickListener(v -> checkAndRequestPermissions());
    }

    private void initializeCarSelector() {
        carSelector = findViewById(R.id.carSelector);

        // Create adapter for spinner
        ArrayAdapter<CharSequence> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item,
                new String[]{"Carro 1", "Carro 2"});

        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        carSelector.setAdapter(adapter);

        carSelector.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                currentCar = position == 0 ? "car1" : "car2";
                Toast.makeText(MainActivity.this,
                        "Seleccionado: " + parent.getItemAtPosition(position),
                        Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                currentCar = "car1"; // Default to car1 if nothing selected
            }
        });
    }

    private void initializeUDP() {
        try {
            udpSocket = new DatagramSocket();
            targetIPs.add(InetAddress.getByName("18.117.168.26"));
            targetIPs.add(InetAddress.getByName("3.142.166.187"));
        } catch (IOException e) {
            e.printStackTrace();
            Toast.makeText(this, "Error initializing UDP: " + e.getMessage(),
                    Toast.LENGTH_SHORT).show();
        }
    }

    private void initializeGPS() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        locationListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                if (location != null) {
                    currentLatitude = location.getLatitude();
                    currentLongitude = location.getLongitude();
                    currentTimestamp = System.currentTimeMillis();
                    updateLocationUI();
                    if (currentSpeed >= 0 && currentRPM >= 0) {
                        sendUDPData();
                    }
                }
            }

            @Override
            public void onStatusChanged(String provider, int status, Bundle extras) {}

            @Override
            public void onProviderEnabled(String provider) {}

            @Override
            public void onProviderDisabled(String provider) {}
        };
        if (checkLocationPermissions()) {
            startLocationUpdates();
        } else {
            requestLocationPermissions();
        }
    }

    private void requestLocationPermissions() {
        ActivityCompat.requestPermissions(this, LOCATION_PERMISSIONS,
                LOCATION_PERMISSION_REQUEST_CODE);
    }

    private void startLocationUpdates() {
        try {
            locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    1000, // 1 segundo
                    1,    // 1 metro
                    locationListener
            );
        } catch (SecurityException e) {
            Toast.makeText(this, "Error al iniciar GPS: " + e.getMessage(),
                    Toast.LENGTH_SHORT).show();
        }
    }

    private boolean checkLocationPermissions() {
        for (String permission : LOCATION_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission)
                    != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    private void updateLocationUI() {
        runOnUiThread(() -> {
            TextView locationText = findViewById(R.id.locationText);
            if (locationText != null) {
                String locationStr = String.format("Lat: %.6f, Lon: %.6f",
                        currentLatitude, currentLongitude);
                locationText.setText(locationStr);
            }
        });
    }

    private void sendUDPData() {
        new Thread(() -> {
            try {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("carId", currentCar);
                jsonObject.put("latitude", String.format("%.6f", currentLatitude));
                jsonObject.put("longitude", String.format("%.6f", currentLongitude));

                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
                String formattedTimestamp = sdf.format(new Date(currentTimestamp));
                jsonObject.put("timestamp", formattedTimestamp);

                jsonObject.put("speed", currentSpeed);
                jsonObject.put("rpm", currentRPM);

                String jsonString = jsonObject.toString();
                byte[] sendData = jsonString.getBytes();

                for (InetAddress targetIP : targetIPs) {
                    DatagramPacket sendPacket = new DatagramPacket(
                            sendData,
                            sendData.length,
                            targetIP,
                            UDP_PORT
                    );
                    udpSocket.send(sendPacket);
                }
                runOnUiThread(() -> statusText.setText("Enviado: " + jsonString));
            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() -> {
                    String errorMessage = "Error sending UDP data: " + e.getMessage();
                    statusText.setText(errorMessage);
                    Toast.makeText(MainActivity.this, errorMessage, Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

    private void initializeViews() {
        scanButton = findViewById(R.id.btnScanDevices);
        listView = findViewById(R.id.devicesList);
        statusText = findViewById(R.id.statusText);
        speedText = findViewById(R.id.speedText);
        rpmText = findViewById(R.id.rpmText);

        devicesList = new ArrayList<>();
        devicesAdapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1);
        listView.setAdapter(devicesAdapter);

        listView.setOnItemClickListener((parent, view, position, id) -> {
            if (checkBluetoothPermissions()) {
                BluetoothDevice device = devicesList.get(position);
                connectToOBDDevice(device);
            } else {
                requestBluetoothPermissions();
            }
        });
    }

    private void initializeBluetooth() {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if (bluetoothAdapter == null) {
            Toast.makeText(this, "Bluetooth no está disponible", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        if (!bluetoothAdapter.isEnabled()) {
            Toast.makeText(this, "Por favor, habilite Bluetooth", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean checkBluetoothPermissions() {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission)
                    != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    private void requestBluetoothPermissions() {
        ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, PERMISSION_REQUEST_CODE);
    }

    private void checkAndRequestPermissions() {
        if (checkBluetoothPermissions()) {
            scanForDevices();
        } else {
            requestBluetoothPermissions();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allPermissionsGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allPermissionsGranted = false;
                    break;
                }
            }
            if (allPermissionsGranted) {
                scanForDevices();
            } else {
                Toast.makeText(this, "Se requieren permisos de Bluetooth para funcionar",
                        Toast.LENGTH_LONG).show();
            }
        }
    }

    private void scanForDevices() {
        try {
            Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
            devicesList.clear();
            devicesAdapter.clear();

            if (pairedDevices.size() > 0) {
                for (BluetoothDevice device : pairedDevices) {
                    devicesList.add(device);
                    devicesAdapter.add(device.getName() + "\n" + device.getAddress());
                }
                devicesAdapter.notifyDataSetChanged();
            } else {
                Toast.makeText(this, "No se encontraron dispositivos emparejados",
                        Toast.LENGTH_SHORT).show();
            }
        } catch (SecurityException e) {
            Toast.makeText(this, "Error de permisos: " + e.getMessage(),
                    Toast.LENGTH_SHORT).show();
        }
    }

    private void connectToOBDDevice(BluetoothDevice device) {
        try {
            socket = device.createRfcommSocketToServiceRecord(OBD2_UUID);
            socket.connect();

            inputStream = socket.getInputStream();
            outputStream = socket.getOutputStream();
            isConnected = true;

            statusText.setText("Conectado a " + device.getName());
            startOBDReading();

        } catch (SecurityException e) {
            Toast.makeText(this, "Error de permisos: " + e.getMessage(),
                    Toast.LENGTH_SHORT).show();
            isConnected = false;
        } catch (IOException e) {
            Toast.makeText(this, "Error al conectar: " + e.getMessage(),
                    Toast.LENGTH_SHORT).show();
            isConnected = false;
        }
    }

    private void startOBDReading() {
        new Thread(() -> {
            while (isConnected) {
                try {
                    String speedResponse = sendOBDCommand(SPEED_PID);
                    if (!speedResponse.isEmpty()) {
                        Message speedMsg = handler.obtainMessage(MESSAGE_READ, speedResponse);
                        speedMsg.sendToTarget();
                    }

                    String rpmResponse = sendOBDCommand(RPM_PID);
                    if (!rpmResponse.isEmpty()) {
                        Message rpmMsg = handler.obtainMessage(MESSAGE_READ, rpmResponse);
                        rpmMsg.sendToTarget();
                    }

                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }).start();
    }

    private String sendOBDCommand(String command) {
        try {
            command += "\r";
            outputStream.write(command.getBytes());
            outputStream.flush();

            StringBuilder response = new StringBuilder();
            byte[] buffer = new byte[1024];
            int bytes;

            long startTime = System.currentTimeMillis();
            while ((System.currentTimeMillis() - startTime) < 1000) {
                if (inputStream.available() > 0) {
                    bytes = inputStream.read(buffer);
                    response.append(new String(buffer, 0, bytes));
                    if (response.toString().contains(">")) break;
                }
            }

            return response.toString().trim();
        } catch (IOException e) {
            runOnUiThread(() -> statusText.setText("Error en comunicación OBD"));
            return "";
        }
    }

    private void processSpeed(String response) {
        try {
            String[] parts = response.split(" ");
            if (parts.length >= 3) {
                currentSpeed = Integer.parseInt(parts[2], 16);
            } else {
                currentSpeed = 0;
            }
            runOnUiThread(() -> {
                speedText.setText(currentSpeed + " km/h");
                if (currentSpeed >= 0 && currentRPM >= 0) {
                    sendUDPData();
                }
            });
        } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
            currentSpeed = 0;
            runOnUiThread(() -> speedText.setText("0 km/h"));
        }
    }

    private void processRPM(String response) {
        try {
            String[] parts = response.split(" ");
            if (parts.length >= 4) {
                int a = Integer.parseInt(parts[2], 16);
                int b = Integer.parseInt(parts[3], 16);
                currentRPM = ((a * 256) + b) / 4;
            } else {
                currentRPM = 0;
            }
            runOnUiThread(() -> {
                rpmText.setText(currentRPM + " RPM");
                if (currentSpeed >= 0 && currentRPM >= 0) {
                    sendUDPData();
                }
            });
        } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
            currentRPM = 0;
            runOnUiThread(() -> rpmText.setText("0 RPM"));
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        if (udpSocket != null && !udpSocket.isClosed()) {
            udpSocket.close();
        }
        if (locationManager != null) {
            locationManager.removeUpdates(locationListener);
        }
        isConnected = false;
    }
}