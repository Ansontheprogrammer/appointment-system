import { Allocated, Scheduler } from "@ssense/sscheduler";
import moment from "moment";
import { Database } from "./db";
const scheduler = new Scheduler();

export async function getAvailableTimes(req, res, next) {
  const { duration, interval, from, schedule, id } = req.body;
  const toDate = moment(from).add(1, "days");
  const type = req.params.type;
  console.log("req.body", req.body);
  if (!duration || !interval || !from || !schedule) {
    res.status(400);
    return next(
      "You need to pass in a duration, interval, 'from' date, and schedule"
    );
  }
  if ((type !== "study" && type !== "rest") || id == null) {
    res.status(400);
    return next("You need to pass in a schedule type and user id");
  }

  const availableTimes = await getTimeSchedule(
    {
      duration,
      interval,
      from,
      schedule,
      toDate,
      id,
    },
    type
  );

  console.log("RETURNING SCHEDULE...", availableTimes);
  return res.json(availableTimes);
}

async function getTimeSchedule(
  { duration, interval, from, toDate, schedule, id },
  type: string
) {
  try {
    let availabiltyMap;
    if (type == "study") {
      availabiltyMap = scheduler.getAvailability({
        from,
        to: toDate,
        duration,
        interval,
        schedule: {
          weekdays: {
            from: "08:00",
            to: "18:00",
            unavailability: schedule.weekdays.unavailability,
          },
          saturday: {
            from: "08:00",
            to: "18:00",
          },
          unavailability: schedule.unavailability,
          allocated: await getFormattedEvents(id),
        },
      });
    } else if (type == "rest") {
      const formattedEvents = await getFormattedEvents(id);
      console.log(formattedEvents, "formatted Events");

      availabiltyMap = scheduler.getIntersection({
        from,
        to: toDate,
        duration,
        interval,
        schedules: [
          {
            weekdays: {
              from: "22:00",
              to: "23:45",
              unavailability: schedule.weekdays.unavailability,
            },
            unavailability: schedule.unavailability,
            allocated: formattedEvents,
          },
        ],
      });
    }
    return mapAvailabilityMapToFriendlyFormat(type, availabiltyMap, from);
  } catch (err) {
    throw err;
  }
}

function mapAvailabilityMapToFriendlyFormat(
  type: string,
  availabiltyMap,
  from
) {
  if (type === "study") {
    return Object.keys(availabiltyMap)
      .map((key) =>
        availabiltyMap[key]
          .filter((availability) => availability.available)
          .map(
            (availability) =>
              `${moment(`${from} ${availability.time}`).format(
                "h:mm:ss a"
              )} - ${moment(`${from} ${availability.time}`)
                /// Add estimated 2 hours to study
                .add(2, "hours")
                .format("h:mm:ss a")}`
          )
      )
      .flat(1);
  } else {
    console.log(availabiltyMap, "availabiltyMap");

    return Object.keys(availabiltyMap)
      .map((key) =>
        availabiltyMap[key]
          .filter((availability) => availability.available)
          .map((availability) => {
            return `${moment(`${from} ${availability.time}`).format(
              "h:mm:ss a"
            )} - ${moment(`${from} ${availability.time}`)
              /// Add estimated 8 hours to sleep
              .add(8, "hours")
              .format("h:mm:ss a")}`;
          })
      )
      .flat(1);
  }
}

async function getFormattedEvents(id: string) {
  try {
    const snapshots = await new Database().findUserEvents(id);

    return (await snapshots.get()).docs.map((doc) => {
      const event: ConsiliumEvent = doc.data() as ConsiliumEvent;

      console.log(event.id, "id");
      return {
        duration: 120,
        from: (event.date as any).toDate(),
      } as Allocated;
    });
  } catch (err) {
    throw err;
  }
}
