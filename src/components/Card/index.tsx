import * as React from 'react'
import firebase from 'firebase/app'
import { useDocumentData } from 'react-firebase-hooks/firestore'
import { DraggableProvided } from 'react-beautiful-dnd'
import { ConfirmationModal } from 'components/ConfirmationModal'
import { EditModal } from 'components/EditModal'
import { useClickOutside } from 'hooks/useClickOutside'
import { useTrapTabKey } from 'hooks/useTrapTabKey'
import { useAlert } from 'components/Alert/AlertStore'
import { Task, TaskFirestoreResult } from 'types'
import {
  CardWrapper,
  CardMenuButton,
  CardMenuLogo,
  CardDate,
  CardLogo,
  CardText,
  CardMenu,
  CardMenuItem,
} from './styles'

type CardProps = {
  task: Task
  provided: DraggableProvided
}

export const Card = ({ provided, task }: CardProps) => {
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = React.useState(
    false
  )
  const [isEditFormOpen, setIsEditFormOpen] = React.useState(false)

  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const [ref] = useClickOutside(() => setIsMenuOpen(false))

  useTrapTabKey({ ref, setOpen: setIsMenuOpen, pause: !isMenuOpen })

  const addSuccessDeleteAlert = useAlert(
    `You successfully deleted a task in ${task.columnType} column.`,
    'success'
  )

  const addSuccessEditAlert = useAlert(
    `You successfully edited a task in ${task.columnType} column.`,
    'success'
  )

  const userId = firebase.auth().currentUser?.uid

  const trimmedColumnType = task.columnType.split(' ').join('')

  const taskDoc = firebase
    .firestore()
    .collection(`users/${userId}/${trimmedColumnType}Tasks`)
    .doc(trimmedColumnType)

  const [taskDocResult] = useDocumentData<TaskFirestoreResult>(taskDoc)

  const handleConfirmationModalSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()

    if (taskDocResult) {
      const newTasks = taskDocResult.tasks.filter(({ id }) => id !== task.id)

      await taskDoc.update({
        tasks: newTasks,
      })

      addSuccessDeleteAlert()

      toggleConfirmationModal()
    }
  }

  const handleEditModalSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    taskText: string
  ) => {
    event.preventDefault()

    if (taskDocResult) {
      const tasksCopy = taskDocResult.tasks.slice()

      const indexOfCurrentTask = tasksCopy.findIndex(({ id }) => id === task.id)

      const modifiedCurrentTask = {
        ...tasksCopy[indexOfCurrentTask],
        text: taskText,
      }

      tasksCopy[indexOfCurrentTask] = modifiedCurrentTask

      await taskDoc.update({
        tasks: tasksCopy,
      })

      addSuccessEditAlert()

      toggleEditModalForm()
    }
  }

  const toggleConfirmationModal = () =>
    setIsConfirmationModalOpen(!isConfirmationModalOpen)

  const toggleEditModalForm = () => setIsEditFormOpen(!isEditFormOpen)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <>
      <CardWrapper
        aria-label={`Task in ${task.columnType} column`}
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <CardLogo aria-hidden="true" />
        <CardMenuButton
          aria-label="Card menu"
          aria-haspopup="menu"
          onClick={(event) => {
            event.stopPropagation()
            toggleMenu()
          }}
        >
          <CardMenuLogo aria-hidden="true" />
        </CardMenuButton>
        <CardText>{task.text}</CardText>
        <CardDate>Created at {task.createdAt}</CardDate>
        {isMenuOpen && (
          <CardMenu role="menu" ref={ref}>
            <CardMenuItem
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation()
                toggleEditModalForm()
              }}
            >
              Edit Task
            </CardMenuItem>
            <CardMenuItem
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation()
                toggleConfirmationModal()
              }}
            >
              Delete Task
            </CardMenuItem>
          </CardMenu>
        )}
      </CardWrapper>
      {isConfirmationModalOpen && (
        <ConfirmationModal
          setOpen={setIsConfirmationModalOpen}
          onSuccess={handleConfirmationModalSubmit}
          toggleModal={toggleConfirmationModal}
          text={`Do you really want to delete this task in ${task.columnType} column?`}
        />
      )}
      {isEditFormOpen && (
        <EditModal
          setOpen={setIsEditFormOpen}
          onSuccess={handleEditModalSubmit}
          toggleModal={toggleEditModalForm}
          taskText={task.text}
        />
      )}
    </>
  )
}
