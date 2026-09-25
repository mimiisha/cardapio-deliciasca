import Avatar from '../../components/Avatar.jsx'
import { comidas, coresFundo, fotoDaEscolha, rostos } from '../../components/icones/avatares.js'

const classeOpcao =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 border-borda bg-papel px-3 py-2 text-base text-tinta hover:border-tinta-suave has-checked:border-tinta has-checked:bg-manteiga has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-tinta'

const classeRadio = 'size-5 shrink-0 accent-tinta focus-visible:outline-none'

const classeGrade = 'mt-2 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:grid-cols-3'

const classeLegenda = 'text-base font-semibold text-tinta'

function OpcaoImagem({ valor, rotulo, marcada, aoEscolher, children }) {
  return (
    <label className={classeOpcao}>
      <input
        type="radio"
        name="avatar-imagem"
        value={valor}
        checked={marcada}
        onChange={aoEscolher}
        className={classeRadio}
      />
      {children}
      <span className="min-w-0 [overflow-wrap:anywhere]">{rotulo}</span>
    </label>
  )
}

function GrupoImagens({ legenda, itens, escolha, corDoRosto, aoEscolher }) {
  return (
    <fieldset className="mt-4">
      <legend className={classeLegenda}>{legenda}</legend>
      <div className={classeGrade}>
        {itens.map(({ chave, rotulo }) => (
          <OpcaoImagem
            key={chave}
            valor={chave}
            rotulo={rotulo}
            marcada={escolha.chave === chave}
            aoEscolher={() => aoEscolher(chave)}
          >
            <Avatar foto={fotoDaEscolha({ chave, cor: corDoRosto(chave) })} tamanho={40} />
          </OpcaoImagem>
        ))}
      </div>
    </fieldset>
  )
}

function SeletorAvatar({ uid, nome, escolha, corEscolhida, aoEscolherImagem, aoEscolherCor }) {
  const rostoSelecionado = rostos.some((rosto) => rosto.chave === escolha.chave)
  const corDoRosto = (chave) => (chave === escolha.chave ? escolha.cor : corEscolhida)

  return (
    <>
      <fieldset>
        <legend className="font-display text-lg text-tinta">Imagem</legend>
        <fieldset className="mt-2">
          <legend className={classeLegenda}>Iniciais</legend>
          <div className={classeGrade}>
            <OpcaoImagem
              valor=""
              rotulo="Iniciais do nome"
              marcada={escolha.chave === null}
              aoEscolher={() => aoEscolherImagem(null)}
            >
              <Avatar uid={uid} nome={nome || 'Cliente'} foto="" tamanho={40} />
            </OpcaoImagem>
          </div>
        </fieldset>
        <GrupoImagens
          legenda="Rostos"
          itens={rostos}
          escolha={escolha}
          corDoRosto={corDoRosto}
          aoEscolher={aoEscolherImagem}
        />
        <GrupoImagens
          legenda="Comidas"
          itens={comidas}
          escolha={escolha}
          corDoRosto={() => null}
          aoEscolher={aoEscolherImagem}
        />
      </fieldset>
      <fieldset
        disabled={!rostoSelecionado}
        aria-describedby={rostoSelecionado ? undefined : 'avatar-cor-dica'}
        className="mt-6"
      >
        <legend className="font-display text-lg text-tinta">Cor de fundo</legend>
        {!rostoSelecionado && (
          <p id="avatar-cor-dica" className="mt-1 text-sm text-tinta-suave">
            A cor de fundo vale para os rostos.
          </p>
        )}
        <div className={classeGrade}>
          {coresFundo.map(({ chave, rotulo, hex }) => (
            <label key={chave} className={`${classeOpcao} ${rostoSelecionado ? '' : 'cursor-not-allowed'}`}>
              <input
                type="radio"
                name="avatar-cor"
                value={chave}
                checked={rostoSelecionado && escolha.cor === chave}
                onChange={() => aoEscolherCor(chave)}
                className={classeRadio}
              />
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full border-2 border-tinta-suave"
                style={{ backgroundColor: hex }}
              />
              <span>{rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  )
}

export default SeletorAvatar
