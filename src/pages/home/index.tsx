import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { HandPalm, Play } from 'phosphor-react'
import {
  CountdownContainer,
  FormContainer,
  HomeContainer,
  MinuteAmountInput,
  Separator,
  StartCountdownButton,
  StopCountdownButton,
  TaskInput,
} from './styles'
import { useEffect, useState } from 'react'
import { differenceInSeconds } from 'date-fns'
import { NewCycleForm } from './Components/NewCycleForm'
import { Countdown } from './Components/Countdown'

const newCycleFormValidationSchema = zod.object({
  task: zod.string().min(1, 'Informe a tarefa'),
  minutesAmount: zod
    .number()
    .min(1, 'Precisa ser no mínimo 5 minutos.')
    .max(60, 'Precisa ser no máximo 60 minutos.'),
})

type NewCycleFormData = zod.infer<typeof newCycleFormValidationSchema>

interface Cycle {
  id: string // representar unicamente um ciclo
  task: string
  minutesAmount: number
  startDate: Date // salvar qual q foi a data q o timer começou/ficou ativo
  interruptedDate?: Date
  finishedDate?: Date
}

export function Home() {
  // estado para cada um dos input, ele inicia com uma lista vazia
  // estado para cada um dos input, se n colocasse as aspas n ficaria como string
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null)

  //amarzena o segundos que se passarm desde q o ciclo foi iniciado
  const [amountSecondsPassed, setAmountSecondsPassed] = useState(0)

  // usa a desestruração para pegar o form
  const { register, handleSubmit, watch, reset } = useForm<NewCycleFormData>({
    //register é um método que adiciona um input ao formulario, fal sobre os campos que vai ter
    //retorna um objeto com várias funções
    resolver: zodResolver(newCycleFormValidationSchema),
    // de que forma quer validar? zod é uma biblioteca de validação
    defaultValues: {
      task: '',
      minutesAmount: 0,
    },
  })

  function handleCreateNewCycle(data: NewCycleFormData) {
    const id = String(new Date().getTime()) // pega a data atual e transforma em milisegundos)
    const newCycle: Cycle = {
      id,
      task: data.task,
      minutesAmount: data.minutesAmount,
      startDate: new Date(), // data atual base da data pra saber quanto tempo passou
    }

    setCycles((state) => [...state, newCycle]) // ele pega o estate atual e adiciona um novo ciclo
    setActiveCycleId(id)
    setAmountSecondsPassed(0) // zera os segundos passados

    reset()
  }

  function handleInterruptCycle() {
    setCycles((state) =>
      state.map((cycle) => {
        if (cycle.id === activeCycleId) {
          return { ...cycle, interruptedDate: new Date() }
        } else {
          return cycle
        }
      }),
    )
    setActiveCycleId(null)
  }

  // com base no id do ciclo ativo, percorrer todos ciclos e retornar o ciclo q tenha o mesmo id
  const activeCycle = cycles.find((cycle) => cycle.id === activeCycleId)

  //converter o numero de minutos em segundos
  // se o ciclo ativo existir, pega o valor de minutosAmount, se não existir, retorna
  const totalSeconds = activeCycle ? activeCycle.minutesAmount * 60 : 0

  useEffect(() => {
    let interval: number // para armazenar o intervalo

    if (activeCycle) {
      interval = setInterval(() => {
        // a cada segundo, atualiza o estado
        // difrença em segundos da data atual  (sempre adiante como primeiro parametro) e a data de inicio do ciclo ativo
        const secondDifference = differenceInSeconds(
          new Date(),
          activeCycle.startDate,
        )

        if (secondDifference >= totalSeconds) {
          setCycles((state) =>
            state.map((cycle) => {
              if (cycle.id === activeCycle.id) {
                return { ...cycle, finishedDate: new Date() }
              } else {
                return cycle
              }
            }),
          )
          setAmountSecondsPassed(totalSeconds) // para ficar zerado
          clearInterval(interval)
        } else {
          setAmountSecondsPassed(secondDifference)
        }
      }, 1000)
    }

    return () => {
      // serev para quando executar dnv e quer fazer algo para limpar o anterior para q n aconteça mais
      clearInterval(interval)
    }
  }, [activeCycle, totalSeconds, activeCycleId]) // sempre q utiliza uma variavel de fora do useEffect, tem que colocar ela como dependencia

  const currentSeconds = activeCycle ? totalSeconds - amountSecondsPassed : 0

  const minutesAmount = Math.floor(currentSeconds / 60) //arrendonda para baixo
  const secondsAmount = currentSeconds % 60 // resto da divisão, o % é o operador de resto

  //transformar o numero em string, a variavel vai ter que ter 2 caracteres, se n tiver vai colocar no começo
  const minutes = String(minutesAmount).padStart(2, '0')
  // padStart, se o numero tiver menos do que o esperado ele vai preencher com algum caractere

  const seconds = String(secondsAmount).padStart(2, '0')

  useEffect(() => {
    if (activeCycle) {
      document.title = `${minutes}:${seconds}`
    }
  }, [minutes, seconds, activeCycle]) // sempre que o minutes e o seconds mudar, ele vai aparecer no titulo

  const task = watch('task') // pega o valor do input, e atualiza toda vez que o input é atualizado
  const isSubmitDisabled = !task
  // event.target.task.value  pega o valor do input
  // com isso perde a fluidez do react, de habilitar, desabilitar, pegar letra por letra, mas ganha em perfomance

  return (
    <HomeContainer>
      <form action="" onSubmit={handleSubmit(handleCreateNewCycle)}>
        <NewCycleForm />
        <Countdown />

        {/* // quando não tem um task, desabilita o botão */}

        {activeCycle ? (
          <StopCountdownButton onClick={handleInterruptCycle} type="button">
            <HandPalm size={28} />
            Interromper
          </StopCountdownButton>
        ) : (
          <StartCountdownButton disabled={isSubmitDisabled} type="submit">
            <Play size={28} />
            Começar
          </StartCountdownButton>
        )}
      </form>
    </HomeContainer>
  )
}
