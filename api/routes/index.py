from fastapi import APIRouter, HTTPException

from sqlalchemy import text

from backend.database import engine


router = APIRouter(
    prefix="/index",
    tags=["Airfare Index"]
)


# ============================================================
# AIRWISE AIRFARE INDEX
# ============================================================

@router.get("")
def get_airfare_index():

    try:

        with engine.connect() as connection:

            rows = connection.execute(
                text(
                    """
                    SELECT
                        id,
                        origin,
                        destination,
                        airline,
                        departure_date,
                        total_fare,
                        expected_fare
                    FROM fare_observations
                    WHERE total_fare IS NOT NULL
                      AND total_fare > 0
                    ORDER BY departure_date, id
                    """
                )
            ).mappings().all()


        if not rows:

            return {
                "status": "success",
                "message": "No fare observations available.",
                "base_index": 100,
                "current_index": 100,
                "change_percent": 0,
                "observations": 0,
                "history": [],
                "routes": []
            }


        # ====================================================
        # PREPARE DATA
        # ====================================================

        observations = []

        for row in rows:

            fare = float(
                row["total_fare"] or 0
            )

            if fare <= 0:
                continue


            departure_date = row[
                "departure_date"
            ]


            if departure_date is None:
                continue


            observations.append(
                {
                    "id": row["id"],
                    "origin": row["origin"],
                    "destination": row["destination"],
                    "airline": row["airline"],
                    "date": departure_date,
                    "fare": fare,
                    "expected_fare": (
                        float(
                            row["expected_fare"]
                        )
                        if row["expected_fare"]
                        is not None
                        else None
                    ),
                }
            )


        if not observations:

            return {
                "status": "success",
                "message": "No dated fare observations available.",
                "base_index": 100,
                "current_index": 100,
                "change_percent": 0,
                "observations": 0,
                "history": [],
                "routes": []
            }


        # ====================================================
        # GROUP BY MONTH
        # ====================================================

        monthly = {}


        for item in observations:

            month = item["date"].strftime(
                "%Y-%m"
            )

            if month not in monthly:

                monthly[month] = []

            monthly[month].append(
                item["fare"]
            )


        monthly_average = {}


        for month, fares in monthly.items():

            monthly_average[month] = (
                sum(fares) /
                len(fares)
            )


        sorted_months = sorted(
            monthly_average.keys()
        )


        # ====================================================
        # BASE PERIOD
        # ====================================================

        base_month = sorted_months[0]

        base_average = monthly_average[
            base_month
        ]


        if base_average <= 0:

            raise ValueError(
                "Invalid base fare average."
            )


        # ====================================================
        # INDEX HISTORY
        # ====================================================

        history = []


        for month in sorted_months:

            average_fare = monthly_average[
                month
            ]

            index_value = (
                average_fare /
                base_average
            ) * 100


            history.append(
                {
                    "period": month,
                    "average_fare": round(
                        average_fare,
                        2
                    ),
                    "index": round(
                        index_value,
                        2
                    )
                }
            )


        current_period = sorted_months[-1]

        current_average = monthly_average[
            current_period
        ]


        current_index = (
            current_average /
            base_average
        ) * 100


        change_percent = (
            current_index - 100
        )


        # ====================================================
        # ROUTE INDEX
        # ====================================================

        route_data = {}


        for item in observations:

            route_key = (
                f"{item['origin']}"
                f"-"
                f"{item['destination']}"
            )


            if route_key not in route_data:

                route_data[route_key] = {
                    "origin": item["origin"],
                    "destination": item["destination"],
                    "fares": []
                }


            route_data[
                route_key
            ]["fares"].append(
                item["fare"]
            )


        routes = []


        for route, data in route_data.items():

            route_average = (
                sum(data["fares"]) /
                len(data["fares"])
            )


            route_index = (
                route_average /
                base_average
            ) * 100


            routes.append(
                {
                    "origin":
                        data["origin"],

                    "destination":
                        data["destination"],

                    "observations":
                        len(data["fares"]),

                    "average_fare":
                        round(
                            route_average,
                            2
                        ),

                    "index":
                        round(
                            route_index,
                            2
                        ),

                    "change_percent":
                        round(
                            route_index - 100,
                            2
                        )
                }
            )


        routes.sort(
            key=lambda item:
                item["index"],
            reverse=True
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return {

            "status": "success",

            "index_name":
                "AIRWISE Airfare Price Index",

            "base_period":
                base_month,

            "base_index":
                100,

            "base_average_fare":
                round(
                    base_average,
                    2
                ),

            "current_period":
                current_period,

            "current_average_fare":
                round(
                    current_average,
                    2
                ),

            "current_index":
                round(
                    current_index,
                    2
                ),

            "change_percent":
                round(
                    change_percent,
                    2
                ),

            "observations":
                len(observations),

            "history":
                history,

            "routes":
                routes[:20]

        }


    except Exception as error:

        print()
        print("AIRFARE INDEX ERROR")
        print(error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )