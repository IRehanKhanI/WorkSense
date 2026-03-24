import json
from channels.generic.websocket import AsyncWebsocketConsumer

class LiveTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Join the live tracking group
        self.group_name = "live_tracking"
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Stub for receiving client messages
        print(f"LiveTrackingConsumer received data: {text_data}")

    async def location_update(self, event):
        # Send location updates to the WebSocket client
        await self.send(text_data=json.dumps(event))