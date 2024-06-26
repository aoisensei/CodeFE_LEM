"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  Draggable,
  DropArg,
} from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Fragment, useEffect, useState } from "react";
import { EventSourceInput } from "@fullcalendar/core/index.js";
import { Transition, Dialog, Listbox } from "@headlessui/react";
import {
  AlertTriangle,
  CheckCircle,
  CheckIcon,
  ChevronDown,
} from "lucide-react";
import {
  CreateJob,
  DeleteJob,
  ListOwnJob,
  UpdateJob,
} from "@/services/job-service";
import { Job } from "@/models/job";
import { ListCard } from "@/services/board-service";
import { Card } from "@/models/card";
import { toast } from "sonner";

interface Event {
  id: number;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}
export const Calendar = () => {
  var currentUserId = "";
  if (typeof window !== "undefined") {
    currentUserId = localStorage.getItem("userId") ?? "";
  }
  const [unscheduled, setUnscheduled] = useState<Job[]>([]); // danh sách job chưa được lên lịch trình
  const [allEvents, setAllEvents] = useState<Job[]>([]); // danh sách những event sẽ hiển thị trên calendar
  const [showModal, setShowModal] = useState(false); // kiểm soát việc hiện thị popup thêm job
  const [showDeleteModal, setShowDeleteModal] = useState(false); // kiểm soát việc hiện thị popup cảnh báo xóa
  const [idToDelete, setIdToDelete] = useState<number | null>(null); // lưu lại id đang được đánh dấu là đang muốn xóa
  const [newEvent, setNewEvent] = useState<Job>(); // lưu dữ liệu của event mới
  const [cards, setCards] = useState<Card[]>([]); // danh sách các cards trong board cá nhân
  const [selected, setSelected] = useState<Card | null>(null); // lưu trữ card được chọn trong danh sách
  const [showError, setShowError] = useState(false); // kiểm soát việc hiện thị thông báo lỗi
  const [currentEventJob, setCurrentEventJob] = useState<any>(); // lưu giữ liệu của job được chọn để kéo thả

  useEffect(() => {
    const fetchData = async () => {
      const data = await ListOwnJob();
      const scheduledData = data?.filter((d) => d.startAt !== null) ?? [];
      const unScheduledData = data?.filter((d) => d.startAt === null) ?? [];
      const allScheduledData = convertJobsToEvents(scheduledData);
      setAllEvents(allScheduledData);
      setUnscheduled(unScheduledData);
      const cards = await ListCard();
      setCards(cards ?? []);
    };
    fetchData();
    //xử lý dữ liệu khi được kéo thả
    let draggableEl = document.getElementById("draggable-el");
    if (draggableEl) {
      new Draggable(draggableEl, {
        itemSelector: ".fc-event",
        eventData: function (eventEl) {
          let title = eventEl.getAttribute("title");
          let id = eventEl.getAttribute("data");
          let start = eventEl.getAttribute("start");
          return { title, id, start };
        },
      });
    }
  }, []);

  function handleDateClick(arg: { date: Date; allDay: boolean }) {
    setNewEvent({
      ...newEvent,
      startAt: arg.date,
      endAt: arg.date,
      isAllDay: arg.allDay,
      id: new Date().getTime(),
    });
    setShowModal(true);
  }

  async function updateEvent(data: DropArg, currentEventJob: Job) {
    if (currentEventJob.id !== null && currentEventJob.id !== undefined) {
      const job: Job = {
        id: currentEventJob.id,
        cardId: currentEventJob.cardId,
        name: currentEventJob.name,
        description: currentEventJob.description,
        creatorId: currentEventJob.creatorId,
        startAt: data.date,
        endAt: data.date,
        isAllDay: false,
        todos: currentEventJob.todos,
        appUserJobMapings: [
          {
            jobId: currentEventJob.id,
            appUserId: Number(currentUserId),
          },
        ],
      };
      const result = await UpdateJob(job, "");
      if (result === null) {
        toast.error("Create job fail", {
          style: {
            color: "red",
          },
        });
      } else {
        toast.success("Create job success", {
          style: {
            color: "green",
          },
        });
      }
      const newEventData = allEvents.concat(convertJobsToEvents([job!]));
      setAllEvents(newEventData);
      window.location.reload();
    }
  }

  function handleDeleteModal(data: { event: { id: string } }) {
    setShowDeleteModal(true);
    setIdToDelete(Number(data.event.id));
  }

  async function handleDelete() {
    setAllEvents(
      allEvents.filter((event) => Number(event.id) !== Number(idToDelete)),
    );
    setShowDeleteModal(false);
    setIdToDelete(null);
    const result = await DeleteJob(idToDelete ?? 0, "");
    window.location.reload();
  }

  function handleCloseModal() {
    setShowModal(false);
    setNewEvent({
      name: "",
      startAt: new Date(),
      isAllDay: false,
      id: 0,
    });
    setShowDeleteModal(false);
    setIdToDelete(null);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setNewEvent({
      ...newEvent,
      name: e.target.value,
    });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (selected === null) {
      setShowError(true);
    } else {
      e.preventDefault();
      const job: Job = {
        cardId: selected?.id,
        name: newEvent?.name,
        startAt: newEvent?.startAt,
        endAt: newEvent?.endAt,
        isAllDay: false,
      };
      const result = await CreateJob(job, "");
      if (result === null) {
        toast.error("Create job fail", {
          style: {
            color: "red",
          },
        });
      } else {
        toast.success("Create job success", {
          style: {
            color: "green",
          },
        });
      }
      const newEventData = allEvents.concat(convertJobsToEvents([newEvent!]));
      setAllEvents(newEventData);
      setShowModal(false);
      setNewEvent({
        name: "",
        startAt: new Date(),
        isAllDay: false,
        id: 0,
      });
    }
  }

  const convertJobsToEvents = (jobs: Job[]): Event[] => {
    return jobs.map((job) => {
      return {
        id: job.id ?? 0,
        title: job.name ?? "",
        start: ((job.startAt ?? "") as string) || "",
        end: ((job.endAt ?? "") as string) || "",
        allDay: job.isAllDay ?? false,
      };
    });
  };

  return (
    <>
      <main className="mb-10 w-full">
        <div className="grid grid-cols-10">
          <div className="col-span-7">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={allEvents as EventSourceInput}
              nowIndicator={true}
              editable={true}
              droppable={true}
              selectable={true}
              selectMirror={true}
              dateClick={handleDateClick}
              drop={(data) => updateEvent(data, currentEventJob ?? {})}
              eventClick={(data) => handleDeleteModal(data)}
            />
          </div>

          <div
            id="draggable-el"
            className="col-span-3 ml-8 mr-5 mt-16 rounded-md border-2 bg-blue-50 p-2"
          >
            <h1 className="text-center text-lg font-bold">Unscheduled list</h1>
            {unscheduled.map((event) => (
              <div
                className="fc-event m-3 ml-auto w-full rounded-md border-2 bg-white p-1 text-center"
                title={event.name}
                key={event.id}
                onClick={() => setCurrentEventJob(event)}
              >
                {event.name}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Transition.Root show={showDeleteModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setShowDeleteModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel
                  className="relative transform overflow-hidden rounded-lg
                        bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                >
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div
                        className="mx-auto flex h-12 w-12 flex-shrink-0 items-center 
                        justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
                      >
                        <AlertTriangle
                          className="h-6 w-6 text-red-600"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <Dialog.Title
                          as="h3"
                          className="text-base font-semibold leading-6 text-gray-900"
                        >
                          Delete Event
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete this event?
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm 
                        font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 
                        shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={showModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setShowModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle
                        className="h-6 w-6 text-green-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-gray-900"
                      >
                        Add Event
                      </Dialog.Title>
                      <form onSubmit={handleSubmit}>
                        <div className="mt-2">
                          <input
                            type="text"
                            name="title"
                            className="block w-full rounded-md border-0 py-1.5 pl-3 
                                text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 
                                placeholder:text-gray-400 
                                focus:ring-2 focus:ring-inset 
                                focus:ring-violet-600 sm:text-sm sm:leading-6"
                            value={newEvent?.name ?? ""}
                            onChange={(e) => handleChange(e)}
                            placeholder="Title"
                          />
                        </div>
                        <div>
                          {/* Drop Down */}
                          <Listbox value={selected} onChange={setSelected}>
                            <div className="relative">
                              <Listbox.Button
                                className="mt-4 block w-full rounded-md border-0 py-1.5 pl-3 
                                text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 
                                placeholder:text-gray-400 
                                focus:ring-2 focus:ring-inset 
                                focus:ring-violet-600 sm:text-sm sm:leading-6"
                              >
                                <span className="block truncate">
                                  {selected === null
                                    ? "Select card"
                                    : selected.name}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                </span>
                              </Listbox.Button>
                              <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                  {cards.map((card, cardIdx) => (
                                    <Listbox.Option
                                      key={cardIdx}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pr-4 ${
                                          active
                                            ? "bg-amber-100 text-amber-900"
                                            : "text-gray-900"
                                        }`
                                      }
                                      value={card}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${
                                              selected
                                                ? "font-medium"
                                                : "font-normal"
                                            }`}
                                          >
                                            {card.name}
                                          </span>
                                          {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                          {showError === true ? (
                            <p className="text-rose-500">Can not null</p>
                          ) : (
                            <></>
                          )}
                        </div>
                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-25 sm:col-start-2"
                            disabled={newEvent?.name === ""}
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                            onClick={handleCloseModal}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
