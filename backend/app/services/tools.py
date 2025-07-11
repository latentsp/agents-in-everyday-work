import datetime
import math
import random
from typing import Any, Dict, List

from google.genai import types


class FunctionTools:
    """Collection of tools/functions that can be called by the AI model."""

    def __init__(self):
        self.functions = {}
        self._register_functions()

    def _register_functions(self):
        """Register all available functions."""
        self.functions = {
            "get_weather": self.get_weather,
            "calculate_math": self.calculate_math,
            "get_current_time": self.get_current_time,
            "convert_currency": self.convert_currency,
        }

    def get_weather(self, location: str, units: str = "celsius") -> Dict[str, Any]:
        """Get weather information for a location."""
        # Mock weather data for demo purposes
        temperatures = {
            "celsius": random.randint(-10, 35),
            "fahrenheit": random.randint(14, 95)
        }

        conditions = ["sunny", "cloudy", "rainy", "snowy", "partly cloudy"]

        return {
            "location": location,
            "temperature": temperatures.get(units, temperatures["celsius"]),
            "units": units,
            "condition": random.choice(conditions),
            "humidity": random.randint(30, 90),
            "wind_speed": random.randint(0, 25),
            "description": f"Current weather in {location}"
        }

    def calculate_math(self, expression: str) -> Dict[str, Any]:
        """Calculate mathematical expressions safely."""
        try:
            # Only allow basic math operations for safety
            allowed_chars = set("0123456789+-*/.() ")
            if not all(c in allowed_chars for c in expression):
                return {"error": "Invalid characters in expression"}

            # Use eval carefully with restricted globals
            result = eval(expression, {"__builtins__": {}}, {
                "abs": abs, "round": round, "min": min, "max": max,
                "pow": pow, "sqrt": math.sqrt, "sin": math.sin, "cos": math.cos,
                "tan": math.tan, "log": math.log, "exp": math.exp, "pi": math.pi,
                "e": math.e
            })

            return {
                "expression": expression,
                "result": result,
                "type": type(result).__name__
            }
        except Exception as e:
            return {"error": f"Calculation error: {str(e)}"}

    def get_current_time(self, timezone: str = "UTC") -> Dict[str, Any]:
        """Get current time information."""
        now = datetime.datetime.now()

        return {
            "current_time": now.isoformat(),
            "timezone": timezone,
            "timestamp": now.timestamp(),
            "formatted": now.strftime("%Y-%m-%d %H:%M:%S"),
            "day_of_week": now.strftime("%A"),
            "month": now.strftime("%B")
        }

    def convert_currency(self, amount: float, from_currency: str, to_currency: str) -> Dict[str, Any]:
        """Convert currency (mock implementation with fake rates)."""
        # Mock exchange rates for demo
        rates = {
            "USD": 1.0,
            "EUR": 0.85,
            "GBP": 0.73,
            "JPY": 110.0,
            "CAD": 1.25,
            "AUD": 1.35
        }

        from_rate = rates.get(from_currency.upper(), 1.0)
        to_rate = rates.get(to_currency.upper(), 1.0)

        # Convert to USD first, then to target currency
        usd_amount = amount / from_rate
        converted_amount = usd_amount * to_rate

        return {
            "original_amount": amount,
            "from_currency": from_currency.upper(),
            "to_currency": to_currency.upper(),
            "converted_amount": round(converted_amount, 2),
            "exchange_rate": round(to_rate / from_rate, 4),
            "note": "Mock exchange rates for demo purposes"
        }

    def execute_function(self, function_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a function with given parameters."""
        if function_name not in self.functions:
            return {"error": f"Function '{function_name}' not found"}

        try:
            func = self.functions[function_name]
            result = func(**parameters)
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_function_declarations(self) -> List[types.FunctionDeclaration]:
        """Get function declarations for the AI model."""
        return [
            types.FunctionDeclaration(
                name="get_weather",
                description="Get current weather information for a specific location",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "location": types.Schema(type=types.Type.STRING, description="The city or location to get weather for"),
                        "units": types.Schema(type=types.Type.STRING, description="Temperature units (celsius or fahrenheit)", enum=["celsius", "fahrenheit"])
                    },
                    required=["location"]
                )
            ),
            types.FunctionDeclaration(
                name="calculate_math",
                description="Calculate mathematical expressions and equations",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "expression": types.Schema(type=types.Type.STRING, description="Mathematical expression to calculate (e.g., '2 + 2', 'sqrt(16)', 'sin(pi/2)')")
                    },
                    required=["expression"]
                )
            ),
            types.FunctionDeclaration(
                name="get_current_time",
                description="Get current date and time information",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "timezone": types.Schema(type=types.Type.STRING, description="Timezone (e.g., 'UTC', 'EST', 'PST')")
                    },
                    required=[]
                )
            ),
            types.FunctionDeclaration(
                name="convert_currency",
                description="Convert an amount from one currency to another",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "amount": types.Schema(type=types.Type.NUMBER, description="Amount to convert"),
                        "from_currency": types.Schema(type=types.Type.STRING, description="Source currency code (e.g., 'USD', 'EUR')"),
                        "to_currency": types.Schema(type=types.Type.STRING, description="Target currency code (e.g., 'USD', 'EUR')")
                    },
                    required=["amount", "from_currency", "to_currency"]
                )
            )
        ]