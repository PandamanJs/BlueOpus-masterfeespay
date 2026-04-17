import re

file_path = "/Users/charleysiwale/master-fees101/Masterfeespay/src/components/AddServicesPage.tsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. State Injection
state_injection = """
    // Boarding specific state
    const [selectedBoardingRoomId, setSelectedBoardingRoomId] = useState<string>("");
    const [isBoardingDropdownOpen, setIsBoardingDropdownOpen] = useState(false);
    const selectedBoardingRoom = schoolData?.boarding_rooms?.find(r => r.id === selectedBoardingRoomId);
    const [boardingFrequency, setBoardingFrequency] = useState<'monthly' | 'termly' | 'yearly' | 'weekly' | 'daily'>('termly');
"""

if "selectedBoardingRoomId" not in content:
    idx = content.find("const [transportFrequency")
    content = content[:idx] + state_injection + content[idx:]


# 2. Extract Transport Block
start_idx = content.find(") : activeTab === 'transport' ? (")
end_idx = content.find(") : activeTab === 'cafeteria' ? (")

if start_idx != -1 and end_idx != -1 and "activeTab === 'boarding' ?" not in content:
    transport_block = content[start_idx:end_idx]
    
    # Transform Transport Block into Boarding Block
    boarding_block = transport_block.replace(") : activeTab === 'transport' ? (", ") : activeTab === 'boarding' ? (")
    
    boarding_block = boarding_block.replace("transport", "boarding")
    boarding_block = boarding_block.replace("Transport", "Boarding")
    
    boarding_block = boarding_block.replace("selectedRouteId", "selectedBoardingRoomId")
    boarding_block = boarding_block.replace("setSelectedRouteId", "setSelectedBoardingRoomId")
    boarding_block = boarding_block.replace("selectedRoute", "selectedBoardingRoom")
    
    boarding_block = boarding_block.replace("isRouteDropdownOpen", "isBoardingDropdownOpen")
    boarding_block = boarding_block.replace("setIsRouteDropdownOpen", "setIsBoardingDropdownOpen")
    
    boarding_block = boarding_block.replace("transportFrequency", "boardingFrequency")
    boarding_block = boarding_block.replace("setTransportFrequency", "setBoardingFrequency")
    
    boarding_block = boarding_block.replace("bus_routes", "boarding_rooms")
    boarding_block = boarding_block.replace("Route", "Room")
    boarding_block = boarding_block.replace("route", "room")
    
    # Inject it directly after transport block, right before the cafeteria block
    content = content[:end_idx] + boarding_block + content[end_idx:]

# Write back
with open(file_path, "w") as f:
    f.write(content)

print("Patch applied successfully")
