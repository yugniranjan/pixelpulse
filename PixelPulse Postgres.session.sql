SELECT "wristbandStatusFlag", COUNT(*)
FROM public."WristbandTrans"
WHERE "LocationID" = 2
GROUP BY "wristbandStatusFlag";
